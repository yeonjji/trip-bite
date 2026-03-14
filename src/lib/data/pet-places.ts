import { createClient } from "@/lib/supabase/server";
import type { PetFriendlyPlace } from "@/types/pet-friendly";

export async function getPetPlaces(params: {
  areaCode?: string;
  sigunguCode?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ items: PetFriendlyPlace[]; totalCount: number }> {
  const { areaCode, sigunguCode, page = 1, pageSize = 12 } = params;

  const supabase = await createClient();

  let query = supabase
    .from("pet_friendly_places")
    .select("*", { count: "exact" })
    .order("rating_avg", { ascending: false });

  if (areaCode) {
    query = query.eq("area_code", areaCode);
  }

  if (sigunguCode) {
    query = query.eq("sigungu_code", sigunguCode);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error("pet_friendly_places fetch error:", error.message);
    return { items: [], totalCount: 0 };
  }

  return {
    items: (data as PetFriendlyPlace[]) ?? [],
    totalCount: count ?? 0,
  };
}

export async function getPetPlaceDetail(
  contentId: string
): Promise<PetFriendlyPlace | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pet_friendly_places")
    .select("*")
    .eq("content_id", contentId)
    .single();

  if (error) {
    console.error("pet_friendly_places detail fetch error:", error.message);
    return null;
  }

  return data as PetFriendlyPlace;
}
