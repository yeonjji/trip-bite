// P1-40: 캠핑장 데이터 접근 함수 (Supabase camping_sites)

import { campingApi } from "@/lib/api/camping-api";
import { createClient } from "@/lib/supabase/server";
import type { CampingSiteDetail } from "@/types/camping";
import type { CampingSite } from "@/types/database";

interface GetCampingSitesParams {
  doNm?: string;
  induty?: string;
  page?: number;
  pageSize?: number;
  sort?: "rating" | "created";
}

export async function getCampingSites(
  params: GetCampingSitesParams
): Promise<{ items: CampingSite[]; totalCount: number }> {
  const { doNm, induty, page = 1, pageSize = 12, sort = "rating" } = params;

  const supabase = await createClient();

  let query = supabase.from("camping_sites").select("*", { count: "exact" });

  if (doNm) {
    query = query.eq("do_nm", doNm);
  }
  if (induty) {
    query = query.eq("induty", induty);
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

  const { data, error, count } = await query;

  if (error) {
    console.error("camping_sites fetch error:", error.message);
    return { items: [], totalCount: 0 };
  }

  return {
    items: (data as CampingSite[]) ?? [],
    totalCount: count ?? 0,
  };
}

export async function getCampingSiteDetail(contentId: string): Promise<{
  site: CampingSite | null;
  detail: CampingSiteDetail | null;
  images: { contentId: string; imageUrl: string }[];
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("camping_sites")
    .select("*")
    .eq("content_id", contentId)
    .single();

  const site = error ? null : (data as CampingSite);

  let detail: CampingSiteDetail | null = null;
  let images: { contentId: string; imageUrl: string }[] = [];

  try {
    detail = await campingApi.detailList(contentId);
  } catch {
    // API 호출 실패 시 null 유지
  }

  try {
    images = await campingApi.imageList(contentId);
  } catch {
    // 이미지 없을 경우 빈 배열 유지
  }

  return { site, detail, images };
}
