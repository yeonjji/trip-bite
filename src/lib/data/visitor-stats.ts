import { createClient } from "@/lib/supabase/server";

function dateAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

const DAY_NAMES: Record<string, string> = {
  "1": "월요일", "2": "화요일", "3": "수요일",
  "4": "목요일", "5": "금요일", "6": "토요일", "7": "일요일",
};

// ─── 상세페이지용 ────────────────────────────────────────────

export interface VisitorTipData {
  localRatio: number;
  outsiderRatio: number;
  foreignRatio: number;
  weekendRatio: number;   // weekendDayAvg / weekdayDayAvg
  quietestDay: string;    // e.g. "월요일"
}

export async function getVisitorTips(signguCode: string | undefined | null): Promise<VisitorTipData | null> {
  if (!signguCode) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("visitor_stats_local")
    .select("daywk_div_cd, tou_div_cd, tou_num")
    .eq("signgu_code", signguCode)
    .gte("base_ymd", dateAgo(60));

  if (!data || data.length === 0) return null;

  const typeTotals: Record<string, number> = { "1": 0, "2": 0, "3": 0 };
  const dayTotals: Record<string, number> = {};

  for (const row of data) {
    const num = Number(row.tou_num);
    typeTotals[row.tou_div_cd] = (typeTotals[row.tou_div_cd] ?? 0) + num;
    dayTotals[row.daywk_div_cd] = (dayTotals[row.daywk_div_cd] ?? 0) + num;
  }

  const typeTotal = Object.values(typeTotals).reduce((a, b) => a + b, 0);
  if (typeTotal === 0) return null;

  const weekdaySum = ["1", "2", "3", "4", "5"].reduce((s, d) => s + (dayTotals[d] ?? 0), 0);
  const weekendSum = (dayTotals["6"] ?? 0) + (dayTotals["7"] ?? 0);
  const weekdayAvg = weekdaySum / 5;
  const weekendAvg = weekendSum / 2;
  const weekendRatio = weekdayAvg > 0 ? weekendAvg / weekdayAvg : 1;

  const quietestDay = Object.entries(dayTotals)
    .sort(([, a], [, b]) => a - b)[0]?.[0] ?? "1";

  return {
    localRatio: typeTotals["1"] / typeTotal,
    outsiderRatio: typeTotals["2"] / typeTotal,
    foreignRatio: typeTotals["3"] / typeTotal,
    weekendRatio,
    quietestDay: DAY_NAMES[quietestDay] ?? "평일",
  };
}

// ─── 메인페이지 큐레이션용 ────────────────────────────────────

export interface CurationDestination {
  contentId: string;
  title: string;
  addr1: string;
  firstImage?: string | null;
  areaCode: string;
  areaNm: string;
}

export interface CurationData {
  quiet: CurationDestination[];
  localFav: CurationDestination[];
  trending: CurationDestination[];
  foreignFav: CurationDestination[];
}

export async function getVisitorCuration(): Promise<CurationData> {
  const empty: CurationData = { quiet: [], localFav: [], trending: [], foreignFav: [] };
  const supabase = await createClient();

  // 광역 지자체 최근 14일 데이터 (최대 ~714행)
  const { data: stats } = await supabase
    .from("visitor_stats_metro")
    .select("area_code, area_nm, tou_div_cd, tou_num, base_ymd")
    .gte("base_ymd", dateAgo(14));

  if (!stats || stats.length === 0) return empty;

  type AreaAgg = {
    areaCode: string;
    areaNm: string;
    local: number;
    outsider: number;
    foreign: number;
    recent7: number;
    prev7: number;
  };

  const week2Start = dateAgo(7);
  const areaMap = new Map<string, AreaAgg>();

  for (const row of stats) {
    if (!areaMap.has(row.area_code)) {
      areaMap.set(row.area_code, {
        areaCode: row.area_code,
        areaNm: row.area_nm,
        local: 0, outsider: 0, foreign: 0,
        recent7: 0, prev7: 0,
      });
    }
    const a = areaMap.get(row.area_code)!;
    const num = Number(row.tou_num);
    if (row.tou_div_cd === "1") a.local += num;
    else if (row.tou_div_cd === "2") a.outsider += num;
    else if (row.tou_div_cd === "3") a.foreign += num;
    if (row.base_ymd >= week2Start) a.recent7 += num;
    else a.prev7 += num;
  }

  const areas = Array.from(areaMap.values()).map((a) => {
    const total = a.local + a.outsider + a.foreign;
    return {
      ...a,
      total,
      localRatio: total > 0 ? a.local / total : 0,
      trendRatio: a.prev7 > 0 ? a.recent7 / a.prev7 : 1,
    };
  });

  if (areas.length === 0) return empty;

  const sorted = [...areas].sort((a, b) => a.total - b.total);
  const medianTotal = sorted[Math.floor(sorted.length / 2)]?.total ?? 0;

  // 한산한 지역: 전체 대비 방문자 적은 곳
  const quietCodes = areas
    .filter((a) => a.total > 0 && a.total < medianTotal)
    .sort((a, b) => a.total - b.total)
    .slice(0, 5)
    .map((a) => a.areaCode);

  // 현지인 추천: 현지인 비율 높은 곳
  const localFavCodes = areas
    .filter((a) => a.localRatio > 0.35)
    .sort((a, b) => b.localRatio - a.localRatio)
    .slice(0, 5)
    .map((a) => a.areaCode);

  // 방문량 증가: 최근 7일 / 이전 7일 비율 높은 곳
  const trendingCodes = areas
    .filter((a) => a.trendRatio > 1.05 && a.prev7 > 0)
    .sort((a, b) => b.trendRatio - a.trendRatio)
    .slice(0, 5)
    .map((a) => a.areaCode);

  // 외국인 추천: 외국인 방문자 절대수 높은 곳
  const foreignFavCodes = areas
    .filter((a) => a.foreign > 0)
    .sort((a, b) => b.foreign - a.foreign)
    .slice(0, 5)
    .map((a) => a.areaCode);

  const allCodes = [
    ...new Set([...quietCodes, ...localFavCodes, ...trendingCodes, ...foreignFavCodes]),
  ];
  if (allCodes.length === 0) return empty;

  // 각 지역 대표 여행지 1개씩 (평점순)
  const { data: destinations } = await supabase
    .from("destinations")
    .select("content_id, title, addr1, first_image, area_code")
    .in("area_code", allCodes)
    .order("rating_avg", { ascending: false })
    .limit(80);

  const destMap = new Map<string, typeof destinations[0]>();
  for (const d of destinations ?? []) {
    if (d && !destMap.has(d.area_code)) destMap.set(d.area_code, d);
  }

  function toCuration(codes: string[]): CurationDestination[] {
    return codes
      .flatMap((code) => {
        const dest = destMap.get(code);
        const area = areaMap.get(code);
        if (!dest || !area) return [];
        return [{
          contentId: dest.content_id,
          title: dest.title,
          addr1: dest.addr1,
          firstImage: dest.first_image,
          areaCode: code,
          areaNm: area.areaNm,
        }];
      });
  }

  return {
    quiet: toCuration(quietCodes),
    localFav: toCuration(localFavCodes),
    trending: toCuration(trendingCodes),
    foreignFav: toCuration(foreignFavCodes),
  };
}
