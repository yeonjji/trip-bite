import { createClient } from "@/lib/supabase/server";
import type { PetFriendlyPlace } from "@/types/pet-friendly";

export async function getPetPlaces(params: {
  areaCode?: string;
  sigunguCode?: string;
  petCl?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ items: PetFriendlyPlace[]; totalCount: number }> {
  const { areaCode, sigunguCode, petCl, page = 1, pageSize = 12 } = params;

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

  if (petCl) {
    query = query.eq("pet_acmpny_cl", petCl);
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
