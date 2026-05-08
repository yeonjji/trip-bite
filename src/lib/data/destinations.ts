// P1-32: Supabase 여행지 데이터 fetch 유틸 함수

import { createClient } from "@/lib/supabase/server";
import { tourApi } from "@/lib/api/tour-api";
import { getCachedOrFetch } from "@/lib/utils/cache";
import { getWikiSummary, type WikiSummary } from "@/lib/api/wikipedia-api";
import { searchKakaoPlace, type KakaoPlace } from "@/lib/api/kakao-api";
import type { Destination } from "@/types/database";
import type { TourDetailCommon, TourImage, TourSpotDetail } from "@/types/tour-api";
import type { PetFriendlyPlace } from "@/types/pet-friendly";
import type { BarrierFreePlace } from "@/types/barrier-free";

const DESTINATION_TTL_HOURS = 24;

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

export async function getDestinationDetail(contentId: string): Promise<{
  destination: Destination | null;
  detail: TourDetailCommon | null;
  intro: TourSpotDetail | null;
  images: TourImage[];
  wiki: WikiSummary | null;
  kakaoPlace: KakaoPlace | null;
  petPlace: PetFriendlyPlace | null;
  petTourInfo: import("@/types/tour-api").TourPetInfo | null;
  barrierFreePlace: BarrierFreePlace | null;
}> {
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("destinations")
    .select("*")
    .eq("content_id", contentId)
    .single();

  const destination = (row as Destination) ?? null;

  // 24시간 캐시: 유효하면 null 반환, 만료/없으면 fetch 결과 반환
  let freshDetail = null;
  try {
    freshDetail = await getCachedOrFetch(
      destination?.cached_at ?? null,
      DESTINATION_TTL_HOURS,
      () => tourApi.detailCommon(contentId)
    );
  } catch {
    // TourAPI 실패 시 Supabase 데이터로 fallback
  }

  let detail: TourDetailCommon | null = null;
  let intro: TourSpotDetail | null = null;
  let images: TourImage[] = [];

  if (freshDetail !== null) {
    // TourAPI에서 새로 가져온 경우
    try {
      const items = freshDetail.response.body.items;
      detail = items !== "" && Array.isArray(items.item) && items.item.length > 0
        ? items.item[0]
        : null;
    } catch {
      detail = null;
    }

    // 상세 소개 + 이미지 병렬 fetch
    const [introRes, imgRes] = await Promise.allSettled([
      tourApi.detailIntro(contentId, "12"),
      tourApi.detailImage(contentId),
    ]);

    if (introRes.status === "fulfilled") {
      const introItems = introRes.value.response.body.items;
      intro = introItems !== "" && introItems.item.length > 0
        ? (introItems.item[0] as TourSpotDetail)
        : null;
    }

    if (imgRes.status === "fulfilled") {
      const imgItems = imgRes.value.response.body.items;
      images = imgItems !== "" ? imgItems.item : [];
    }
  } else if (destination) {
    // 캐시 유효: Supabase 데이터를 TourDetailCommon 형태로 변환
    detail = {
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
      mapx: destination.mapx !== undefined ? String(destination.mapx) : undefined,
      mapy: destination.mapy !== undefined ? String(destination.mapy) : undefined,
      firstimage: destination.first_image,
      firstimage2: destination.first_image2,
    };

    // 캐시 유효 시에도 intro는 항상 최신 fetch
    try {
      const introRes = await tourApi.detailIntro(contentId, "12");
      const introItems = introRes.response.body.items;
      intro = introItems !== "" && introItems.item.length > 0
        ? (introItems.item[0] as TourSpotDetail)
        : null;
    } catch {
      intro = null;
    }
  }

  // title 확정 후 Wiki + Kakao 병렬 호출
  const resolvedTitle = detail?.title ?? destination?.title ?? ""
  const resolvedLat = detail?.mapy ? parseFloat(detail.mapy) : (destination?.mapy ?? undefined)
  const resolvedLng = detail?.mapx ? parseFloat(detail.mapx) : (destination?.mapx ?? undefined)

  const [wikiRes, kakaoRes, petRes, barrierFreeRes, petTourRes] = await Promise.allSettled([
    resolvedTitle ? getWikiSummary(resolvedTitle) : Promise.resolve(null),
    resolvedTitle
      ? searchKakaoPlace(
          resolvedTitle,
          typeof resolvedLat === "number" ? resolvedLat : undefined,
          typeof resolvedLng === "number" ? resolvedLng : undefined
        )
      : Promise.resolve(null),
    supabase.from("pet_friendly_places").select("*").eq("content_id", contentId).maybeSingle(),
    supabase.from("barrier_free_places").select("*").eq("content_id", contentId).maybeSingle(),
    tourApi.detailPetTour(contentId),
  ])

  const wiki = wikiRes.status === "fulfilled" ? wikiRes.value : null
  const kakaoPlace = kakaoRes.status === "fulfilled" ? kakaoRes.value : null
  const petPlace = petRes.status === "fulfilled" ? (petRes.value.data as PetFriendlyPlace | null) : null
  const barrierFreePlace = barrierFreeRes.status === "fulfilled" ? (barrierFreeRes.value.data as BarrierFreePlace | null) : null

  let petTourInfo: import("@/types/tour-api").TourPetInfo | null = null
  if (petTourRes.status === "fulfilled") {
    try {
      const petItems = petTourRes.value.response.body.items
      petTourInfo = petItems !== "" && petItems.item.length > 0 ? petItems.item[0] : null
    } catch {
      petTourInfo = null
    }
  }

  return { destination, detail, intro, images, wiki, kakaoPlace, petPlace, petTourInfo, barrierFreePlace };
}
