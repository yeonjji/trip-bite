// P1-37: 맛집 데이터 레이어 (Supabase destinations, content_type_id='39')

import { createClient } from "@/lib/supabase/server";
import { tourApi } from "@/lib/api/tour-api";
import type { Destination } from "@/types/database";
import type { TourDetailCommon, RestaurantDetail, TourImage } from "@/types/tour-api";

export async function getRestaurants(params: {
  areaCode?: string;
  sigunguCode?: string;
  page?: number;
  pageSize?: number;
  sort?: "rating" | "created";
}): Promise<{ items: Destination[]; totalCount: number }> {
  const { areaCode, sigunguCode, page = 1, pageSize = 12, sort = "rating" } = params;

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
