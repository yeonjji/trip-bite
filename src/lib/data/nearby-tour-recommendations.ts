import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type NearbyTourType = "travel" | "festival" | "accommodation" | "restaurant" | "cafe";

export interface NearbyTourItem {
  id: string;
  contentId: string;
  title: string;
  type: NearbyTourType;
  address: string;
  image: string;
  lat: number;
  lng: number;
  distance: number;
}

export type NearbyTourRecommendations = Record<NearbyTourType, NearbyTourItem[]>;

const CONTENT_TYPE_BY_NEARBY_TYPE: Record<NearbyTourType, string> = {
  travel: "12",
  festival: "15",
  accommodation: "32",
  restaurant: "39",
  cafe: "39",
};

export const NEARBY_TOUR_PLACEHOLDER_IMAGE = "/file.svg";

const DEFAULT_RADIUS_METERS = 15_000;

// RPC row shape (migration 041 RETURNS TABLE 일치)
interface NearbyTourRpcRow {
  content_id: string;
  content_type_id: string;
  title: string;
  addr1: string;
  first_image: string | null;
  lat: number;
  lng: number;
  distance_km: number;
}

function contentTypeIdToNearbyType(contentTypeId: string): NearbyTourType | null {
  switch (contentTypeId) {
    case "12":
      return "travel";
    case "15":
      return "festival";
    case "32":
      return "accommodation";
    case "39":
      return "restaurant"; // cafe와 restaurant은 동일 content_type_id, 호출 시 type 지정으로 구분
    default:
      return null;
  }
}

// content_type_id를 requested types 안의 매칭 NearbyTourType 배열로 변환.
// 39 → restaurant + cafe 동시 가능 (caller 요청에 따라).
function nearbyTypesForContentTypeId(
  contentTypeId: string,
  requested: readonly NearbyTourType[],
): NearbyTourType[] {
  const result: NearbyTourType[] = [];
  if (contentTypeId === "39") {
    if (requested.includes("restaurant")) result.push("restaurant");
    if (requested.includes("cafe")) result.push("cafe");
    return result;
  }
  const single = contentTypeIdToNearbyType(contentTypeId);
  if (single && requested.includes(single)) result.push(single);
  return result;
}

function rowToNearbyTourItem(row: NearbyTourRpcRow, type: NearbyTourType): NearbyTourItem {
  return {
    id: `${type}-${row.content_id}`,
    contentId: row.content_id,
    title: row.title,
    type,
    address: row.addr1,
    image: row.first_image || NEARBY_TOUR_PLACEHOLDER_IMAGE,
    lat: row.lat,
    lng: row.lng,
    distance: row.distance_km,
  };
}

export async function getNearbyTourItems({
  lat,
  lng,
  type,
  excludeContentId,
  limit = 6,
  radiusMeters = DEFAULT_RADIUS_METERS,
}: {
  lat: number;
  lng: number;
  type: NearbyTourType;
  excludeContentId?: string | null;
  limit?: number;
  radiusMeters?: number;
}): Promise<NearbyTourItem[]> {
  const supabase = await createClient();
  const contentTypeId = CONTENT_TYPE_BY_NEARBY_TYPE[type];

  const { data, error } = await supabase.rpc("get_nearby_tour_items", {
    p_lat: lat,
    p_lng: lng,
    p_exclude: excludeContentId ?? null,
    p_types: [contentTypeId],
    radius_meters: radiusMeters,
    result_limit: limit,
  });

  if (error) {
    console.error(`nearby ${type} RPC error:`, error.message);
    return [];
  }

  return ((data as NearbyTourRpcRow[]) ?? []).map((row) => rowToNearbyTourItem(row, type));
}

export async function getNearbyTourRecommendations({
  lat,
  lng,
  excludeContentId,
  types = ["travel", "festival", "accommodation"],
  limitPerType = 6,
}: {
  lat: number;
  lng: number;
  excludeContentId?: string | null;
  types?: NearbyTourType[];
  limitPerType?: number;
}): Promise<NearbyTourRecommendations> {
  const contentTypeIds = Array.from(
    new Set(types.map((t) => CONTENT_TYPE_BY_NEARBY_TYPE[t])),
  );

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_nearby_tour_items", {
    p_lat: lat,
    p_lng: lng,
    p_exclude: excludeContentId ?? null,
    p_types: contentTypeIds,
    radius_meters: DEFAULT_RADIUS_METERS,
    result_limit: limitPerType * contentTypeIds.length,
  });

  const empty: NearbyTourRecommendations = {
    travel: [], festival: [], accommodation: [], restaurant: [], cafe: [],
  };

  if (error) {
    console.error("getNearbyTourRecommendations RPC error:", error.message);
    return empty;
  }

  // content_type_id 39는 restaurant + cafe 양쪽에 매핑됨.
  // requested types에 두 가지 모두 있으면 같은 row를 두 type 모두에 push.
  const grouped: NearbyTourRecommendations = { ...empty };
  for (const row of ((data as NearbyTourRpcRow[]) ?? [])) {
    const candidateTypes = nearbyTypesForContentTypeId(row.content_type_id, types);
    for (const t of candidateTypes) {
      if (grouped[t].length >= limitPerType) continue;
      grouped[t].push(rowToNearbyTourItem(row, t));
    }
  }
  return grouped;
}

export const getNearbyTourRecommendationsCached = unstable_cache(
  async (
    lat: number,
    lng: number,
    excludeContentId: string | null,
    types: NearbyTourType[],
    limitPerType = 6,
  ): Promise<NearbyTourRecommendations> => {
    return getNearbyTourRecommendations({
      lat,
      lng,
      excludeContentId,
      types,
      limitPerType,
    });
  },
  ["nearby-tour-recommendations"],
  { revalidate: 3600, tags: ["nearby-tour-recommendations"] },
);

export async function getNearbyFoodItems({
  lat,
  lng,
  type,
  limit = 8,
  radiusMeters = DEFAULT_RADIUS_METERS,
}: {
  lat: number;
  lng: number;
  type: "restaurant" | "cafe";
  limit?: number;
  radiusMeters?: number;
}): Promise<NearbyTourItem[]> {
  return getNearbyTourItems({ lat, lng, type, limit, radiusMeters });
}
