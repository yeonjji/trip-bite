// P1-37: 맛집 데이터 레이어 (Supabase destinations, content_type_id='39')

import { createClient } from "@/lib/supabase/server";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { getDestinationIntro, getDestinationImagesFromDb } from "./destinations";
import type { Destination } from "@/types/database";
import type { TourDetailCommon, RestaurantDetail, TourImage } from "@/types/tour-api";
import { roundCoord } from "@/lib/utils/cache-key";

export async function getRestaurants(params: {
  areaCode?: string;
  sigunguCode?: string;
  cat3?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sort?: "rating" | "created";
}): Promise<{ items: Destination[]; totalCount: number }> {
  const { areaCode, sigunguCode, cat3, search, page = 1, pageSize = 12, sort = "rating" } = params;

  const supabase = await createClient();

  let query = supabase
    .from("destinations")
    .select("*", { count: "exact" })
    .eq("content_type_id", "39");

  if (areaCode) {
    query = query.eq("area_code", areaCode);
  }

  if (sigunguCode) {
    query = query.eq("sigungu_code", sigunguCode);
  }

  if (cat3) {
    query = query.eq("cat3", cat3);
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
    console.error("restaurants fetch error:", error.message);
    return { items: [], totalCount: 0 };
  }

  return {
    items: (data as Destination[]) ?? [],
    totalCount: count ?? 0,
  };
}

export async function getRestaurantDetail(contentId: string): Promise<{
  destination: Destination | null;
  detail: TourDetailCommon | null;
  intro: RestaurantDetail | null;
  images: TourImage[];
}> {
  const supabase = await createClient();

  const { data: destination, error } = await supabase
    .from("destinations")
    .select("*")
    .eq("content_id", contentId)
    .eq("content_type_id", "39")
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(`맛집 상세 조회 실패: ${error.message}`);
  }

  // destinations 행(content_type_id='39')이 source of truth. detailCommon 호출 불필요.
  // detailIntro/detailImage는 DB 컬럼이 아직 없어 외부 호출 유지 (TODO: Step 2 plan).
  const dest = (destination as Destination) ?? null;
  const detail: TourDetailCommon | null = dest
    ? {
        contentid: dest.content_id,
        contenttypeid: dest.content_type_id,
        title: dest.title,
        homepage: dest.homepage,
        overview: dest.overview,
        createdtime: dest.created_at,
        modifiedtime: dest.updated_at,
        tel: dest.tel,
        addr1: dest.addr1,
        addr2: dest.addr2,
        mapx: dest.mapx != null ? String(dest.mapx) : undefined,
        mapy: dest.mapy != null ? String(dest.mapy) : undefined,
        firstimage: dest.first_image,
        firstimage2: dest.first_image2,
      }
    : null;

  // DB-first 패턴 (Step 2 plan): intro/images 모두 destinations 테이블 jsonb 컬럼에서 읽음.
  // 백필 안 된 row는 함수 내부에서 외부 호출 + upsert.
  const [introData, imageData] = await Promise.all([
    getDestinationIntro(contentId, "39"),
    getDestinationImagesFromDb(contentId),
  ]);

  // RestaurantDetail은 TourSpotDetail과 다른 음식점 전용 스키마. jsonb는 광범위
  // 타입이라 캐스팅으로 좁힌다. 빈 객체는 데이터 없음으로 처리.
  const intro =
    introData && Object.keys(introData).length > 0
      ? (introData as unknown as RestaurantDetail)
      : null;

  return {
    destination: dest,
    detail,
    intro,
    images: imageData,
  };
}

export async function getNearbyRestaurants(
  lat: number,
  lng: number,
  excludeContentId?: string,
  radiusMeters = 5000,
  limit = 4
): Promise<Destination[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_nearby_restaurants", {
    lat,
    lng,
    radius_meters: radiusMeters,
    result_limit: limit,
    exclude_id: excludeContentId ?? null,
  });

  if (error) {
    console.error("근처 맛집 조회 실패:", error.message);
    return [];
  }

  return (data as Destination[]) ?? [];
}

function getAnonClient() {
  return createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

// 내부 캐시 함수: 라운딩된 좌표 + excludeId를 받아 인자 기반 키로 동작.
const _nearbyRestaurantsCachedInner = unstable_cache(
  async (
    rLat: number,
    rLng: number,
    excludeContentId: string | null,
    radiusMeters: number,
    limit: number,
  ): Promise<Destination[]> => {
    const supabase = getAnonClient();
    const { data, error } = await supabase.rpc("get_nearby_restaurants", {
      lat:           rLat,
      lng:           rLng,
      radius_meters: radiusMeters,
      result_limit:  limit,
      exclude_id:    excludeContentId,
    });
    if (error) {
      console.error("[getNearbyRestaurantsCached] RPC error:", error.message);
      return [];
    }
    return (data as Destination[]) ?? [];
  },
  ["nearby-restaurants"],
  { revalidate: 3600, tags: ["nearby-restaurants"] },
);

// 캐시된 버전 — 상세 페이지 Suspense 내부 전용.
export function getNearbyRestaurantsCached(
  lat: number,
  lng: number,
  excludeContentId?: string,
  radiusMeters = 5000,
  limit = 4,
): Promise<Destination[]> {
  return _nearbyRestaurantsCachedInner(
    roundCoord(lat),
    roundCoord(lng),
    excludeContentId ?? null,
    radiusMeters,
    limit,
  );
}
