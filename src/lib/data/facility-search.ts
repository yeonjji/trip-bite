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

const FACILITY_KEYWORDS = [
  "주차장", "주차", "공영주차",
  "와이파이", "wifi", "wi-fi", "무선인터넷",
  "화장실", "공중화장실", "toilet", "restroom",
  "충전소", "충전", "전기차충전", "ev충전", "전기차",
];

function detectFacilityTypes(q: string): FacilityType[] | null {
  const lower = q.toLowerCase().replace(/\s/g, "");
  const types: FacilityType[] = [];
  if (/주차/.test(lower)) types.push("parking");
  if (/와이파이|wifi|wi-fi|무선/.test(lower)) types.push("wifi");
  if (/화장실|toilet|restroom/.test(lower)) types.push("toilet");
  if (/충전|ev|전기차/.test(lower)) types.push("ev");
  return types.length > 0 ? types : null;
}

function extractAreaQuery(q: string): string {
  let area = q;
  for (const kw of FACILITY_KEYWORDS) {
    area = area.replace(new RegExp(kw, "gi"), "");
  }
  return area.replace(/\s+/g, " ").trim();
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
  const detectedTypes = detectFacilityTypes(query);
  const targetTypes: FacilityType[] = detectedTypes ?? ["parking", "wifi", "toilet", "ev"];

  const areaQuery = extractAreaQuery(query);
  const namePattern = `%${query}%`;
  const areaPattern = areaQuery ? `%${areaQuery}%` : `%${query}%`;

  const results: FacilitySearchResult[] = [];

  await Promise.allSettled([
    targetTypes.includes("parking")
      ? supabase
          .from("parking_lots")
          .select("id, name, address_road, address_jibun, sido_name, sigungu_name, area_code, fee_type")
          .or(
            areaQuery
              ? `sido_name.ilike.${areaPattern},sigungu_name.ilike.${areaPattern},address_road.ilike.${areaPattern},name.ilike.${namePattern}`
              : `name.ilike.${namePattern},address_road.ilike.${namePattern}`
          )
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
          .or(
            areaQuery
              ? `sido_name.ilike.${areaPattern},sigungu_name.ilike.${areaPattern},address_road.ilike.${areaPattern},place_name.ilike.${namePattern}`
              : `place_name.ilike.${namePattern},address_road.ilike.${namePattern}`
          )
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
          .or(
            areaQuery
              ? `address_road.ilike.${areaPattern},address_jibun.ilike.${areaPattern},name.ilike.${namePattern}`
              : `name.ilike.${namePattern},address_road.ilike.${namePattern}`
          )
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
          .or(
            areaQuery
              ? `addr.ilike.${areaPattern},stat_nm.ilike.${namePattern}`
              : `stat_nm.ilike.${namePattern},addr.ilike.${namePattern}`
          )
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
