// P1-32: Supabase 여행지 데이터 fetch 유틸 함수

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Destination } from "@/types/database";
import type { TourDetailCommon, TourSpotDetail, TourImage } from "@/types/tour-api";
import type { PetFriendlyPlace } from "@/types/pet-friendly";
import type { BarrierFreePlace } from "@/types/barrier-free";


// 자연경관 + 고건물 위주, 신식건물 제외
const HERO_KEYWORDS = [
  "경복궁", "창덕궁", "불국사", "석굴암",
  "하회마을", "수원화성", "종묘",
  "통도사", "해인사", "부석사",
  "성산일출봉", "한라산", "설악산",
  "지리산", "순천만", "내장산", "덕유산",
]

export async function getHeroImages(): Promise<string[]> {
  const supabase = await createClient()
  const orFilter = HERO_KEYWORDS.map(k => `title.ilike.%${k}%`).join(",")
  const { data } = await supabase
    .from("destinations")
    .select("first_image, title")
    .or(orFilter)
    .not("first_image", "is", null)
    .not("title", "ilike", "%수유중%")
    .limit(30)
  return (data ?? []).map(d => d.first_image).filter(Boolean) as string[]
}

export interface PetBadgeInfo {
  cl?: string;   // pet_acmpny_cl: "1"=실내 "2"=실외 "3"=실내외
  typeCd?: string;
}

export async function getDestinations(params: {
  areaCode?: string;
  sigunguCode?: string;
  contentTypeId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sort?: "rating" | "created";
  petOnly?: boolean;
  petCl?: string;
}): Promise<{ items: Destination[]; totalCount: number; petInfoMap: Map<string, PetBadgeInfo> }> {
  const { areaCode, sigunguCode, contentTypeId, search, page = 1, pageSize = 12, sort = "rating", petOnly, petCl } = params;

  const supabase = await createClient();

  // pet 필터가 활성화된 경우 먼저 pet content_id 목록 조회
  let petFilterIds: string[] | null = null;
  if (petOnly || petCl) {
    let petQuery = supabase.from("pet_friendly_places").select("content_id");
    if (petCl) petQuery = petQuery.eq("pet_acmpny_cl", petCl);
    const { data: petData } = await petQuery;
    petFilterIds = petData?.map((p: { content_id: string }) => p.content_id) ?? [];
  }

  let query = supabase
    .from("destinations")
    .select("*", { count: "exact" });

  if (petFilterIds !== null) {
    if (petFilterIds.length === 0) {
      return { items: [], totalCount: 0, petInfoMap: new Map() };
    }
    query = query.in("content_id", petFilterIds);
  }

  if (areaCode) {
    query = query.eq("area_code", areaCode);
  }

  if (sigunguCode) {
    query = query.eq("sigungu_code", sigunguCode);
  }

  if (contentTypeId) {
    query = query.eq("content_type_id", contentTypeId);
  } else {
    // 음식점(39)은 맛집 목록에서 별도 관리
    query = query.neq("content_type_id", "39");
  }

  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  query = query.order("has_image", { ascending: false, nullsFirst: false });
  if (sort === "rating") {
    query = query.order("rating_avg", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error("destinations fetch error:", error.message);
    return { items: [], totalCount: 0, petInfoMap: new Map() };
  }

  const items = (data as Destination[]) ?? [];

  // 현재 페이지 항목 중 반려동물 동반 가능 여부 조회 (카드 배지용)
  const petInfoMap = new Map<string, PetBadgeInfo>();
  if (items.length > 0) {
    const ids = items.map((i) => i.content_id);
    const { data: petBadgeData } = await supabase
      .from("pet_friendly_places")
      .select("content_id, pet_acmpny_cl, acmpny_type_cd")
      .in("content_id", ids);
    for (const p of petBadgeData ?? []) {
      petInfoMap.set(p.content_id, { cl: p.pet_acmpny_cl ?? undefined, typeCd: p.acmpny_type_cd ?? undefined });
    }
  }

  return { items, totalCount: count ?? 0, petInfoMap };
}

/**
 * Shell loader — page-shell에 즉시 필요한 데이터만 한 번에 fetch.
 * SEO/LCP/뱃지에 필요한 destination + detailCommon + petPlace + barrierFreePlace 만 포함.
 * intro / images / wiki / kakao / petTourInfo는 Suspense 안에서 별도 fetch.
 */
export const getDestinationShell = cache(async function getDestinationShell(contentId: string): Promise<{
  destination: Destination | null;
  detail: TourDetailCommon | null;
  petPlace: PetFriendlyPlace | null;
  barrierFreePlace: BarrierFreePlace | null;
}> {
  const supabase = await createClient();

  const [rowRes, petRes, barrierRes] = await Promise.allSettled([
    supabase.from("destinations").select("*").eq("content_id", contentId).single(),
    supabase.from("pet_friendly_places").select("*").eq("content_id", contentId).maybeSingle(),
    supabase.from("barrier_free_places").select("*").eq("content_id", contentId).maybeSingle(),
  ]);

  const destination =
    rowRes.status === "fulfilled" ? ((rowRes.value.data as Destination | null) ?? null) : null;
  const petPlace =
    petRes.status === "fulfilled" ? ((petRes.value.data as PetFriendlyPlace | null) ?? null) : null;
  const barrierFreePlace =
    barrierRes.status === "fulfilled"
      ? ((barrierRes.value.data as BarrierFreePlace | null) ?? null)
      : null;

  // destinations row가 source of truth. sync-destinations.mjs가 TourAPI 데이터를 정기적으로 채움.
  const detail: TourDetailCommon | null = destination
    ? {
        contentid: destination.content_id,
        contenttypeid: destination.content_type_id,
        title: destination.title,
        homepage: destination.homepage,
        overview: destination.overview,
        createdtime: destination.created_at,
        modifiedtime: destination.updated_at,
        tel: destination.tel,
        addr1: destination.addr1,
        addr2: destination.addr2,
        mapx: destination.mapx != null ? String(destination.mapx) : undefined,
        mapy: destination.mapy != null ? String(destination.mapy) : undefined,
        firstimage: destination.first_image,
        firstimage2: destination.first_image2,
      }
    : null;

  return { destination, detail, petPlace, barrierFreePlace };
});

/**
 * Streaming 전용: detailIntro 데이터 (운영시간/주차/체험안내/세계유산 등).
 *
 * DB-only. source of truth = destination_intros 테이블 (sync-destination-intros.mjs).
 * 백필 안 된 row는 null → IntroSection이 "정보없음"으로 처리.
 */
export async function getDestinationIntro(
  contentId: string,
): Promise<TourSpotDetail | null> {
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("destination_intros")
    .select("common_fields, extras")
    .eq("content_id", contentId)
    .maybeSingle();

  if (!row) return null;

  const common = (row.common_fields ?? {}) as Record<string, unknown>;
  const extras = (row.extras ?? {}) as Record<string, unknown>;

  return { ...common, ...extras } as unknown as TourSpotDetail;
}

/**
 * 상세 이미지 갤러리 데이터 (destination_images 테이블 1:N).
 *
 * DB-only. source of truth = sync-destination-images.mjs.
 * serial_num 오름차순.
 */
export async function getDestinationImagesFromDb(
  contentId: string,
): Promise<TourImage[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("destination_images")
    .select("origin_url, image_name, serial_num")
    .eq("content_id", contentId)
    .order("serial_num", { ascending: true });

  return (data ?? []).map((r) => ({
    contentid: contentId,
    originimgurl: r.origin_url,
    imgname: r.image_name ?? "",
    smallimageurl: r.origin_url,
    serialnum: r.serial_num != null ? String(r.serial_num) : "",
    cpyrhtDivCd: "",
  } as unknown as TourImage));
}

