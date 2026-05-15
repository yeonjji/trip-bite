// P1-37: 맛집 데이터 레이어 (Supabase destinations, content_type_id='39')

import { createClient } from "@/lib/supabase/server";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { tourApi } from "@/lib/api/tour-api";
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

  const [detailRes, introRes, imagesRes] = await Promise.allSettled([
    tourApi.detailCommon(contentId),
    tourApi.detailIntro(contentId, "39"),
    tourApi.detailImage(contentId),
  ]);

  const detail =
    detailRes.status === "fulfilled"
      ? (detailRes.value.response.body.items !== ""
          ? detailRes.value.response.body.items.item[0]
          : null) ?? null
      : null;

  const intro =
    introRes.status === "fulfilled"
      ? (introRes.value.response.body.items !== ""
          ? (introRes.value.response.body.items.item[0] as RestaurantDetail)
          : null) ?? null
      : null;

  const images =
    imagesRes.status === "fulfilled" && imagesRes.value.response.body.items !== ""
      ? imagesRes.value.response.body.items.item
      : [];

  return {
    destination: (destination as Destination) ?? null,
    detail,
    intro,
    images,
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
