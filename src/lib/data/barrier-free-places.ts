import { createClient } from "@/lib/supabase/server";
import type { BarrierFreePlace } from "@/types/barrier-free";

export async function getBarrierFreePlaces(params: {
  areaCode?: string;
  sigunguCode?: string;
  features?: string[];
  page?: number;
  pageSize?: number;
}): Promise<{ items: BarrierFreePlace[]; totalCount: number }> {
  const { areaCode, sigunguCode, features, page = 1, pageSize = 12 } = params;

  const supabase = await createClient();

  let query = supabase
    .from("barrier_free_places")
    .select("*", { count: "exact" })
    .order("rating_avg", { ascending: false });

  if (areaCode) {
    query = query.eq("area_code", areaCode);
  }

  if (sigunguCode) {
    query = query.eq("sigungu_code", sigunguCode);
  }

  if (features && features.length > 0) {
    for (const feature of features) {
      query = query.not(feature, "is", null)
    }
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error("barrier_free_places fetch error:", error.message);
    return { items: [], totalCount: 0 };
  }

  return {
    items: (data as BarrierFreePlace[]) ?? [],
    totalCount: count ?? 0,
  };
}

export async function getBarrierFreePlaceDetail(
  contentId: string
): Promise<BarrierFreePlace | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("barrier_free_places")
    .select("*")
    .eq("content_id", contentId)
    .single();

  if (error) {
    console.error("barrier_free_places detail fetch error:", error.message);
    return null;
  }

  return data as BarrierFreePlace;
}
