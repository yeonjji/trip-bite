// P1-40: 캠핑장 데이터 접근 함수 (Supabase camping_sites)

import { campingApi } from "@/lib/api/camping-api";
import { createClient } from "@/lib/supabase/server";
import type { CampingSiteDetail } from "@/types/camping";
import type { CampingSite } from "@/types/database";

interface GetCampingSitesParams {
  doNm?: string;
  induty?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sort?: "rating" | "created";
  petOnly?: boolean;
}

export async function getCampingSites(
  params: GetCampingSitesParams
): Promise<{ items: CampingSite[]; totalCount: number }> {
  const { doNm, induty, search, page = 1, pageSize = 12, sort = "rating", petOnly } = params;

  const supabase = await createClient();

  let query = supabase.from("camping_sites").select("*", { count: "exact" });

  if (doNm) {
    query = query.eq("do_nm", doNm);
  }
  if (induty) {
    query = query.eq("induty", induty);
  }
  if (search) {
    query = query.ilike("faclt_nm", `%${search}%`);
  }
  if (petOnly) {
    query = query.not("animal_cmg_cl", "is", null).not("animal_cmg_cl", "ilike", "%불가%");
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

  const [detailRes, imagesRes] = await Promise.allSettled([
    campingApi.detailList(contentId),
    campingApi.imageList(contentId),
  ]);

  const detail: CampingSiteDetail | null = detailRes.status === "fulfilled" ? detailRes.value : null;
  const images: { contentId: string; imageUrl: string }[] = imagesRes.status === "fulfilled" ? imagesRes.value : [];

  return { site, detail, images };
}
