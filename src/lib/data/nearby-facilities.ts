import { createClient as createAnonClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

function getAnonClient() {
  return createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export interface NearbyToilet {
  id: string;
  name: string;
  address_road: string | null;
  address_jibun: string | null;
  lat: number;
  lng: number;
  baby_care: boolean;
  cctv: boolean;
  emergency_bell: boolean;
  open_time: string | null;
  manage_org: string | null;
  phone: string | null;
  distance_m: number;
}

export interface NearbyWifi {
  id: string;
  place_name: string;
  place_detail: string | null;
  facility_type: string | null;
  provider: string | null;
  ssid: string | null;
  address_road: string | null;
  address_jibun: string | null;
  lat: number;
  lng: number;
  distance_m: number;
}

export interface NearbyParking {
  id: string;
  name: string;
  type: string | null;
  address_road: string | null;
  address_jibun: string | null;
  lat: number;
  lng: number;
  capacity: number | null;
  fee_type: string | null;
  base_fee: number | null;
  weekday_open: string | null;
  weekday_close: string | null;
  disabled_spots: number | null;
  phone: string | null;
  distance_m: number;
}

export interface NearbyEvStation {
  stat_id: string;
  stat_nm: string;
  addr: string | null;
  lat: number;
  lng: number;
  busi_nm: string | null;
  use_time: string | null;
  parking_free: string | null;
  charger_count: number;
  has_fast: boolean;
  has_slow: boolean;
  max_output: number | null;
  distance_m: number;
}

export interface NearbyFacilitiesResult {
  toilets: NearbyToilet[];
  wifi: NearbyWifi[];
  parking: NearbyParking[];
  evStations: NearbyEvStation[];
  errors?: { toilets?: string; wifi?: string; parking?: string; ev?: string };
}

export async function getNearbyFacilities(
  lat: number,
  lng: number,
  radiusMeters = 2000,
  limit = 5
): Promise<NearbyFacilitiesResult> {
  const supabase = getAnonClient();

  const [toiletsResult, wifiResult, parkingResult, evResult] = await Promise.allSettled([
    supabase.rpc("get_nearby_public_toilets", {
      p_lat: lat, p_lng: lng,
      radius_meters: radiusMeters,
      result_limit: limit,
    }),
    supabase.rpc("get_nearby_free_wifi", {
      p_lat: lat, p_lng: lng,
      radius_meters: radiusMeters,
      result_limit: limit,
    }),
    supabase.rpc("get_nearby_parking", {
      p_lat: lat, p_lng: lng,
      radius_meters: radiusMeters,
      result_limit: limit,
    }),
    supabase.rpc("get_nearby_ev_stations", {
      p_lat: lat, p_lng: lng,
      radius_meters: radiusMeters,
      result_limit: limit,
    }),
  ]);

  const errors: NearbyFacilitiesResult["errors"] = {};

  if (toiletsResult.status === "rejected") errors.toilets = String(toiletsResult.reason);
  else if (toiletsResult.value.error) errors.toilets = toiletsResult.value.error.message;

  if (wifiResult.status === "rejected") errors.wifi = String(wifiResult.reason);
  else if (wifiResult.value.error) errors.wifi = wifiResult.value.error.message;

  if (parkingResult.status === "rejected") errors.parking = String(parkingResult.reason);
  else if (parkingResult.value.error) errors.parking = parkingResult.value.error.message;

  if (evResult.status === "rejected") errors.ev = String(evResult.reason);
  else if (evResult.value.error) errors.ev = evResult.value.error.message;

  return {
    toilets: toiletsResult.status === "fulfilled" && !toiletsResult.value.error
      ? (toiletsResult.value.data as NearbyToilet[]) ?? []
      : [],
    wifi: wifiResult.status === "fulfilled" && !wifiResult.value.error
      ? (wifiResult.value.data as NearbyWifi[]) ?? []
      : [],
    parking: parkingResult.status === "fulfilled" && !parkingResult.value.error
      ? (parkingResult.value.data as NearbyParking[]) ?? []
      : [],
    evStations: evResult.status === "fulfilled" && !evResult.value.error
      ? (evResult.value.data as NearbyEvStation[]) ?? []
      : [],
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
}

export const getNearbyFacilitiesCached = unstable_cache(
  async (
    lat: number,
    lng: number,
    radiusMeters = 2000,
    limit = 5,
  ): Promise<NearbyFacilitiesResult> => {
    const supabase = getAnonClient();

    const [toiletsResult, wifiResult, parkingResult, evResult] = await Promise.allSettled([
      supabase.rpc("get_nearby_public_toilets", {
        p_lat: lat, p_lng: lng, radius_meters: radiusMeters, result_limit: limit,
      }),
      supabase.rpc("get_nearby_free_wifi", {
        p_lat: lat, p_lng: lng, radius_meters: radiusMeters, result_limit: limit,
      }),
      supabase.rpc("get_nearby_parking", {
        p_lat: lat, p_lng: lng, radius_meters: radiusMeters, result_limit: limit,
      }),
      supabase.rpc("get_nearby_ev_stations", {
        p_lat: lat, p_lng: lng, radius_meters: radiusMeters, result_limit: limit,
      }),
    ]);

    return {
      toilets: toiletsResult.status === "fulfilled" && !toiletsResult.value.error
        ? (toiletsResult.value.data as NearbyToilet[]) ?? []
        : [],
      wifi: wifiResult.status === "fulfilled" && !wifiResult.value.error
        ? (wifiResult.value.data as NearbyWifi[]) ?? []
        : [],
      parking: parkingResult.status === "fulfilled" && !parkingResult.value.error
        ? (parkingResult.value.data as NearbyParking[]) ?? []
        : [],
      evStations: evResult.status === "fulfilled" && !evResult.value.error
        ? (evResult.value.data as NearbyEvStation[]) ?? []
        : [],
    };
  },
  ["nearby-facilities"],
  { revalidate: 3600, tags: ["nearby-facilities"] },
);
