import { createClient } from "@/lib/supabase/server";

export type FacilityType = "parking" | "wifi" | "toilet" | "ev";

export interface FacilitySearchResult {
  id: string;
  type: FacilityType;
  name: string;
  address: string;
  sidoName: string | null;
  sigunguName: string | null;
  areaCode: string | null;
  detailHref: string;
  tip: string;
}

function detectFacilityTypes(q: string): FacilityType[] | null {
  const lower = q.toLowerCase();
  const types: FacilityType[] = [];
  if (/주차/.test(lower)) types.push("parking");
  if (/와이파이|wifi|wi-fi|무선/.test(lower)) types.push("wifi");
  if (/화장실|toilet|restroom/.test(lower)) types.push("toilet");
  if (/충전|ev충전|전기차|전기 차/.test(lower)) types.push("ev");
  return types.length > 0 ? types : null;
}

function makeTip(type: FacilityType, item: Record<string, unknown>): string {
  switch (type) {
    case "parking":
      return (item.fee_type as string) === "무료" ? "무료 주차 가능" : "유료 주차장";
    case "wifi":
      return `${item.facility_type ?? "공공시설"} 내 무료 와이파이`;
    case "toilet":
      return item.open_time ? `운영시간 ${item.open_time}` : "공중화장실";
    case "ev":
      return item.has_fast ? "급속 충전 가능" : "완속 충전";
    default:
      return "";
  }
}

const LIMIT_PER_TYPE = 4;

export async function searchFacilities(query: string): Promise<FacilitySearchResult[]> {
  if (!query.trim()) return [];

  const supabase = await createClient();
  const pattern = `%${query}%`;
  const detectedTypes = detectFacilityTypes(query);
  const targetTypes: FacilityType[] = detectedTypes ?? ["parking", "wifi", "toilet", "ev"];

  const results: FacilitySearchResult[] = [];

  await Promise.allSettled([
    targetTypes.includes("parking")
      ? supabase
          .from("parking_lots")
          .select("id, name, address_road, address_jibun, sido_name, sigungu_name, area_code, fee_type")
          .or(`name.ilike.${pattern},address_road.ilike.${pattern},sido_name.ilike.${pattern},sigungu_name.ilike.${pattern}`)
          .limit(LIMIT_PER_TYPE)
          .then(({ data }) => {
            for (const row of data ?? []) {
              results.push({
                id: row.id,
                type: "parking",
                name: row.name,
                address: row.address_road ?? row.address_jibun ?? "",
                sidoName: row.sido_name,
                sigunguName: row.sigungu_name,
                areaCode: row.area_code,
                detailHref: `/facilities/parking/${row.id}`,
                tip: makeTip("parking", row as Record<string, unknown>),
              });
            }
          })
      : Promise.resolve(),

    targetTypes.includes("wifi")
      ? supabase
          .from("free_wifi")
          .select("id, place_name, address_road, address_jibun, sido_name, sigungu_name, area_code, facility_type")
          .or(`place_name.ilike.${pattern},address_road.ilike.${pattern},sido_name.ilike.${pattern},sigungu_name.ilike.${pattern}`)
          .limit(LIMIT_PER_TYPE)
          .then(({ data }) => {
            for (const row of data ?? []) {
              results.push({
                id: row.id,
                type: "wifi",
                name: row.place_name,
                address: row.address_road ?? row.address_jibun ?? "",
                sidoName: row.sido_name,
                sigunguName: row.sigungu_name,
                areaCode: row.area_code,
                detailHref: `/facilities/wifi/${row.id}`,
                tip: makeTip("wifi", row as Record<string, unknown>),
              });
            }
          })
      : Promise.resolve(),

    targetTypes.includes("toilet")
      ? supabase
          .from("public_toilets")
          .select("id, name, address_road, address_jibun, area_code, open_time")
          .or(`name.ilike.${pattern},address_road.ilike.${pattern},address_jibun.ilike.${pattern}`)
          .limit(LIMIT_PER_TYPE)
          .then(({ data }) => {
            for (const row of data ?? []) {
              results.push({
                id: row.id,
                type: "toilet",
                name: row.name,
                address: row.address_road ?? row.address_jibun ?? "",
                sidoName: null,
                sigunguName: null,
                areaCode: row.area_code,
                detailHref: `/facilities/restrooms/${row.id}`,
                tip: makeTip("toilet", row as Record<string, unknown>),
              });
            }
          })
      : Promise.resolve(),

    targetTypes.includes("ev")
      ? supabase
          .from("ev_stations")
          .select("stat_id, stat_nm, addr, zcode, has_fast")
          .or(`stat_nm.ilike.${pattern},addr.ilike.${pattern}`)
          .limit(LIMIT_PER_TYPE)
          .then(({ data }) => {
            for (const row of data ?? []) {
              results.push({
                id: row.stat_id,
                type: "ev",
                name: row.stat_nm ?? "",
                address: row.addr ?? "",
                sidoName: null,
                sigunguName: null,
                areaCode: row.zcode,
                detailHref: `/facilities/ev-charging/${row.stat_id}`,
                tip: makeTip("ev", row as Record<string, unknown>),
              });
            }
          })
      : Promise.resolve(),
  ]);

  return results;
}
