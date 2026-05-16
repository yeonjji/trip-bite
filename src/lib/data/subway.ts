import { createClient } from "@/lib/supabase/server";

export interface NearbySubway {
  station_id: string;
  station_name: string;
  line_name: string;
  road_address: string | null;
  jibun_address: string | null;
  lat: number;
  lng: number;
  distance_m: number;
}

/**
 * 좌표 주변 지하철역을 거리 순으로 반환.
 *
 * Source of truth: subway_stations 테이블 (sync-subway-stations.mjs로 적재).
 * 외부 API 호출 없음 — PostGIS RPC 1회.
 */
export async function getNearbySubway(
  lat: number,
  lng: number,
  radiusMeters = 2000,
  limit = 5,
): Promise<NearbySubway[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_nearby_subway", {
    p_lat: lat,
    p_lng: lng,
    radius_meters: radiusMeters,
    result_limit: limit,
  });
  if (error) {
    console.error("[getNearbySubway] RPC error:", error.message);
    return [];
  }
  return (data as NearbySubway[]) ?? [];
}
