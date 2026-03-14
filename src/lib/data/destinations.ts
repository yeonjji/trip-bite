// P1-32: Supabase 여행지 데이터 fetch 유틸 함수

import { createClient } from "@/lib/supabase/server";
import { tourApi } from "@/lib/api/tour-api";
import { getCachedOrFetch } from "@/lib/utils/cache";
import type { Destination } from "@/types/database";
import type { TourDetailCommon, TourImage } from "@/types/tour-api";

const DESTINATION_TTL_HOURS = 24;

export async function getDestinations(params: {
  areaCode?: string;
  sigunguCode?: string;
  contentTypeId?: string;
  page?: number;
  pageSize?: number;
  sort?: "rating" | "created";
}): Promise<{ items: Destination[]; totalCount: number }> {
  const { areaCode, sigunguCode, contentTypeId, page = 1, pageSize = 12, sort = "rating" } = params;

  const supabase = await createClient();

  let query = supabase
    .from("destinations")
    .select("*", { count: "exact" });

  if (areaCode) {
    query = query.eq("area_code", areaCode);
  }

  if (sigunguCode) {
    query = query.eq("sigungu_code", sigunguCode);
  }

  if (contentTypeId) {
    query = query.eq("content_type_id", contentTypeId);
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
    console.error("destinations fetch error:", error.message);
    return { items: [], totalCount: 0 };
  }

  return {
    items: (data as Destination[]) ?? [],
    totalCount: count ?? 0,
  };
}

export async function getDestinationDetail(contentId: string): Promise<{
  destination: Destination | null;
  detail: TourDetailCommon | null;
  images: TourImage[];
}> {
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("destinations")
    .select("*")
    .eq("content_id", contentId)
    .single();

  const destination = (row as Destination) ?? null;

  // 24시간 캐시: 유효하면 null 반환, 만료/없으면 fetch 결과 반환
  const freshDetail = await getCachedOrFetch(
    destination?.cached_at ?? null,
    DESTINATION_TTL_HOURS,
    () => tourApi.detailCommon(contentId)
  );

  let detail: TourDetailCommon | null = null;
  let images: TourImage[] = [];

  if (freshDetail !== null) {
    // TourAPI에서 새로 가져온 경우
    const items = freshDetail.response.body.items;
    detail = items !== "" && items.item.length > 0 ? items.item[0] : null;

    // 이미지 fetch
    try {
      const imgRes = await tourApi.detailImage(contentId);
      const imgItems = imgRes.response.body.items;
      images = imgItems !== "" ? imgItems.item : [];
    } catch {
      images = [];
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
  }

  return { destination, detail, images };
}
