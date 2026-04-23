import { createClient } from "@/lib/supabase/server";

export interface PublicToilet {
  id: string;
  manage_no: string;
  name: string;
  address_road: string;
  address_jibun: string;
  lat: number | null;
  lng: number | null;
  area_code: string | null;
  sigungu_name: string | null;
  manage_org: string | null;
  phone: string | null;
  open_time: string | null;
  open_time_detail: string | null;
  male_toilets: number | null;
  female_toilets: number | null;
  disabled_male: number | null;
  disabled_female: number | null;
  baby_care: boolean;
  cctv: boolean;
  emergency_bell: boolean;
}

interface GetToiletsParams {
  zcode?: string;
  sigunguName?: string;
  baby_care?: boolean;
  page?: number;
  pageSize?: number;
}

interface GetToiletsResult {
  items: PublicToilet[];
  totalCount: number;
}

export async function getPublicToilets(params: GetToiletsParams = {}): Promise<GetToiletsResult> {
  const { zcode, sigunguName, baby_care, page = 1, pageSize = 30 } = params;
  const supabase = await createClient();

  let query = supabase.from("public_toilets").select("*", { count: "exact" });

  if (zcode) query = query.eq("area_code", zcode);
  if (sigunguName) query = query.eq("sigungu_name", sigunguName);
  if (baby_care) query = query.eq("baby_care", true);

  const from = (page - 1) * pageSize;
  query = query.range(from, from + pageSize - 1).order("name");

  const { data, count, error } = await query;
  if (error) {
    console.error("공중화장실 데이터 조회 실패:", error);
    return { items: [], totalCount: 0 };
  }
  return { items: (data as PublicToilet[]) ?? [], totalCount: count ?? 0 };
}

export async function getToiletById(id: string): Promise<PublicToilet | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("public_toilets")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data as PublicToilet;
}
