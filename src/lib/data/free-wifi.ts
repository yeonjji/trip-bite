import { createClient } from "@/lib/supabase/server";

export interface FreeWifi {
  id: string;
  manage_no: string;
  place_name: string;
  place_detail: string | null;
  sido_name: string | null;
  sigungu_name: string | null;
  facility_type: string | null;
  provider: string | null;
  ssid: string | null;
  address_road: string | null;
  address_jibun: string | null;
  lat: number | null;
  lng: number | null;
  area_code: string | null;
}

interface GetWifiParams {
  zcode?: string;
  page?: number;
  pageSize?: number;
}

interface GetWifiResult {
  items: FreeWifi[];
  totalCount: number;
}

export async function getFreeWifi(params: GetWifiParams = {}): Promise<GetWifiResult> {
  const { zcode, page = 1, pageSize = 30 } = params;
  const supabase = await createClient();

  let query = supabase.from("free_wifi").select("*", { count: "exact" });

  if (zcode) query = query.eq("area_code", zcode);

  const from = (page - 1) * pageSize;
  query = query.range(from, from + pageSize - 1).order("place_name");

  const { data, count, error } = await query;
  if (error) {
    console.error("공공 와이파이 데이터 조회 실패:", error);
    return { items: [], totalCount: 0 };
  }
  return { items: (data as FreeWifi[]) ?? [], totalCount: count ?? 0 };
}

export async function getWifiById(id: string): Promise<FreeWifi | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("free_wifi")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data as FreeWifi;
}
