import { createClient } from "@/lib/supabase/server";

export interface ParkingLot {
  id: string;
  manage_no: string;
  name: string;
  type: string | null;
  address_jibun: string | null;
  address_road: string | null;
  lat: number | null;
  lng: number | null;
  capacity: number | null;
  fee_type: string | null;
  base_fee: number | null;
  weekday_open: string | null;
  weekday_close: string | null;
  sat_open: string | null;
  sat_close: string | null;
  holiday_open: string | null;
  holiday_close: string | null;
  disabled_spots: number | null;
  phone: string | null;
  area_code: string | null;
  sido_name: string | null;
  sigungu_name: string | null;
}

interface GetParkingParams {
  zcode?: string;
  sigunguName?: string;
  smprcSe?: string;
  page?: number;
  pageSize?: number;
}

interface GetParkingResult {
  items: ParkingLot[];
  totalCount: number;
  error?: string;
}

export async function getParkingById(id: string): Promise<ParkingLot | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("parking_lots")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as ParkingLot;
}

export async function getParking(params: GetParkingParams = {}): Promise<GetParkingResult> {
  const { zcode, sigunguName, smprcSe, page = 1, pageSize = 30 } = params;
  const supabase = await createClient();

  let query = supabase.from("parking_lots").select("*", { count: "exact" });

  if (zcode) query = query.eq("area_code", zcode);
  if (sigunguName) query = query.eq("sigungu_name", sigunguName);
  if (smprcSe) query = query.eq("fee_type", smprcSe);

  const from = (page - 1) * pageSize;
  query = query.range(from, from + pageSize - 1).order("name");

  const { data, count, error } = await query;
  if (error) {
    console.error("주차장 데이터 조회 실패:", error.message);
    return { items: [], totalCount: 0, error: error.message };
  }
  return { items: (data as ParkingLot[]) ?? [], totalCount: count ?? 0 };
}
