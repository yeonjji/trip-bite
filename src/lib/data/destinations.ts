// P1-32: Supabase 여행지 데이터 fetch 유틸 함수

import { createClient } from "@/lib/supabase/server";
import { tourApi } from "@/lib/api/tour-api";
import { getCachedOrFetch } from "@/lib/utils/cache";
import { getWikiSummary, type WikiSummary } from "@/lib/api/wikipedia-api";
import { searchKakaoPlace, type KakaoPlace } from "@/lib/api/kakao-api";
import type { Destination } from "@/types/database";
import type { TourDetailCommon, TourImage, TourSpotDetail } from "@/types/tour-api";

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
  intro: TourSpotDetail | null;
  images: TourImage[];
  wiki: WikiSummary | null;
  kakaoPlace: KakaoPlace | null;
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

  const [wikiRes, kakaoRes] = await Promise.allSettled([
    resolvedTitle ? getWikiSummary(resolvedTitle) : Promise.resolve(null),
    resolvedTitle
      ? searchKakaoPlace(
          resolvedTitle,
          typeof resolvedLat === "number" ? resolvedLat : undefined,
          typeof resolvedLng === "number" ? resolvedLng : undefined
        )
      : Promise.resolve(null),
  ])

  const wiki = wikiRes.status === "fulfilled" ? wikiRes.value : null
  const kakaoPlace = kakaoRes.status === "fulfilled" ? kakaoRes.value : null

  return { destination, detail, intro, images, wiki, kakaoPlace };
}
