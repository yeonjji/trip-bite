import { createClient } from "@/lib/supabase/server";
import { tourApi } from "@/lib/api/tour-api";
import type { PetFriendlyPlace } from "@/types/pet-friendly";
import type { TourPetInfo } from "@/types/tour-api";

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

export async function getPetPlaceDetail(
  contentId: string
): Promise<{ place: PetFriendlyPlace | null; petTourInfo: TourPetInfo | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pet_friendly_places")
    .select("*")
    .eq("content_id", contentId)
    .single();

  if (error) {
    console.error("pet_friendly_places detail fetch error:", error.message);
    return { place: null, petTourInfo: null };
  }

  let petTourInfo: TourPetInfo | null = null;
  try {
    const petRes = await tourApi.detailPetTour(contentId);
    const petItems = petRes.response.body.items;
    petTourInfo = petItems !== "" && petItems.item.length > 0 ? petItems.item[0] : null;
  } catch {
    petTourInfo = null;
  }

  return { place: data as PetFriendlyPlace, petTourInfo };
}
