import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";

// 쿠키 없는 공개 클라이언트 — unstable_cache 내부에서 안전하게 사용 가능
function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function dateAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

const DAY_NAMES: Record<string, string> = {
  "1": "월요일", "2": "화요일", "3": "수요일",
  "4": "목요일", "5": "금요일", "6": "토요일", "7": "일요일",
};

function monthToSeason(m: number): "봄" | "여름" | "가을" | "겨울" {
  if (m >= 3 && m <= 5) return "봄";
  if (m >= 6 && m <= 8) return "여름";
  if (m >= 9 && m <= 11) return "가을";
  return "겨울";
}

// ─── Types ────────────────────────────────────────────────────

export interface VisitorTipData {
  localRatio: number;
  outsiderRatio: number;
  foreignRatio: number;
  weekendRatio: number;     // (주말 1일 평균) / (평일 1일 평균)
  quietestDay: string;      // 방문자 가장 적은 요일
  busiestDay: string;       // 방문자 가장 많은 요일
  dominantType: "local" | "outsider" | "foreign";
  hasSeasonData: boolean;
  peakSeason?: "봄" | "여름" | "가을" | "겨울";
}

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
  weekendPop: CurationDestination[];
  peaceful: CurationDestination[];
}

// ─── Internal fetch logic ─────────────────────────────────────

async function _fetchVisitorTips(signguCode: string): Promise<VisitorTipData | null> {
  const supabase = getClient();

  const { data } = await supabase
    .from("visitor_stats_local")
    .select("daywk_div_cd, tou_div_cd, tou_num, base_ymd")
    .eq("signgu_code", signguCode)
    .gte("base_ymd", dateAgo(180));

  if (!data || data.length === 0) return null;

  const typeTotals: Record<string, number> = { "1": 0, "2": 0, "3": 0 };
  const dayTotals: Record<string, number> = {};
  const monthTotals: Record<number, number> = {};

  for (const row of data) {
    const num = Number(row.tou_num);
    typeTotals[row.tou_div_cd] = (typeTotals[row.tou_div_cd] ?? 0) + num;
    dayTotals[row.daywk_div_cd] = (dayTotals[row.daywk_div_cd] ?? 0) + num;
    const month = new Date(row.base_ymd).getMonth() + 1;
    monthTotals[month] = (monthTotals[month] ?? 0) + num;
  }

  const typeTotal = Object.values(typeTotals).reduce((a, b) => a + b, 0);
  if (typeTotal === 0) return null;

  const weekdaySum = ["1", "2", "3", "4", "5"].reduce((s, d) => s + (dayTotals[d] ?? 0), 0);
  const weekendSum = (dayTotals["6"] ?? 0) + (dayTotals["7"] ?? 0);
  const weekendRatio = weekdaySum > 0 ? (weekendSum / 2) / (weekdaySum / 5) : 1;

  const sortedDays = Object.entries(dayTotals).sort(([, a], [, b]) => a - b);
  const quietestDay = DAY_NAMES[sortedDays[0]?.[0] ?? "1"] ?? "평일";
  const busiestDay = DAY_NAMES[sortedDays.at(-1)?.[0] ?? "6"] ?? "주말";

  const dominant: VisitorTipData["dominantType"] =
    typeTotals["1"] >= typeTotals["2"] && typeTotals["1"] >= typeTotals["3"]
      ? "local"
      : typeTotals["3"] > typeTotals["2"]
      ? "foreign"
      : "outsider";

  const distinctMonths = Object.keys(monthTotals).length;
  let peakSeason: VisitorTipData["peakSeason"];
  if (distinctMonths >= 3) {
    const peakMonth = parseInt(
      Object.entries(monthTotals).sort(([, a], [, b]) => b - a)[0][0]
    );
    peakSeason = monthToSeason(peakMonth);
  }

  return {
    localRatio: typeTotals["1"] / typeTotal,
    outsiderRatio: typeTotals["2"] / typeTotal,
    foreignRatio: typeTotals["3"] / typeTotal,
    weekendRatio,
    quietestDay,
    busiestDay,
    dominantType: dominant,
    hasSeasonData: distinctMonths >= 3,
    peakSeason,
  };
}

async function _fetchVisitorCuration(): Promise<CurationData> {
  const empty: CurationData = {
    quiet: [], localFav: [], trending: [],
    foreignFav: [], weekendPop: [], peaceful: [],
  };
  const supabase = getClient();

  const { data: stats } = await supabase
    .from("visitor_stats_metro")
    .select("area_code, area_nm, tou_div_cd, tou_num, base_ymd, daywk_div_cd")
    .gte("base_ymd", dateAgo(14));

  if (!stats || stats.length === 0) return empty;

  type AreaAgg = {
    areaCode: string; areaNm: string;
    local: number; outsider: number; foreign: number;
    recent7: number; prev7: number;
    weekendTotal: number; weekdayTotal: number;
  };

  const week2Start = dateAgo(7);
  const areaMap = new Map<string, AreaAgg>();

  for (const row of stats) {
    if (!areaMap.has(row.area_code)) {
      areaMap.set(row.area_code, {
        areaCode: row.area_code, areaNm: row.area_nm,
        local: 0, outsider: 0, foreign: 0,
        recent7: 0, prev7: 0, weekendTotal: 0, weekdayTotal: 0,
      });
    }
    const a = areaMap.get(row.area_code)!;
    const num = Number(row.tou_num);
    if (row.tou_div_cd === "1") a.local += num;
    else if (row.tou_div_cd === "2") a.outsider += num;
    else if (row.tou_div_cd === "3") a.foreign += num;
    if (row.base_ymd >= week2Start) a.recent7 += num;
    else a.prev7 += num;
    if (["6", "7"].includes(String(row.daywk_div_cd))) a.weekendTotal += num;
    else a.weekdayTotal += num;
  }

  const areas = Array.from(areaMap.values())
    .map((a) => {
      const total = a.local + a.outsider + a.foreign;
      const weekdayAvg = a.weekdayTotal / 5;
      const weekendAvg = a.weekendTotal / 2;
      return {
        ...a,
        total,
        localRatio: total > 0 ? a.local / total : 0,
        trendRatio: a.prev7 > 0 ? a.recent7 / a.prev7 : 1,
        weekendRatio: weekdayAvg > 0 ? weekendAvg / weekdayAvg : 1,
      };
    })
    .filter((a) => a.total > 0);

  if (areas.length === 0) return empty;

  const medianTotal =
    [...areas].sort((a, b) => a.total - b.total)[Math.floor(areas.length / 2)]?.total ?? 0;

  const quietCodes = areas
    .filter((a) => a.total < medianTotal)
    .sort((a, b) => a.total - b.total)
    .slice(0, 5).map((a) => a.areaCode);

  const localFavCodes = areas
    .slice().sort((a, b) => b.localRatio - a.localRatio)
    .slice(0, 5).map((a) => a.areaCode);

  const trendingCodes = areas
    .filter((a) => a.trendRatio > 1.05 && a.prev7 > 0)
    .sort((a, b) => b.trendRatio - a.trendRatio)
    .slice(0, 5).map((a) => a.areaCode);

  const foreignFavCodes = areas
    .slice().sort((a, b) => b.foreign - a.foreign)
    .slice(0, 5).map((a) => a.areaCode);

  const weekendPopCodes = areas
    .filter((a) => a.weekendRatio > 1.3)
    .sort((a, b) => b.weekendRatio - a.weekendRatio)
    .slice(0, 5).map((a) => a.areaCode);

  const peacefulCodes = areas
    .filter((a) => a.total < medianTotal && a.weekendRatio < 1.25)
    .sort((a, b) => a.weekendRatio - b.weekendRatio)
    .slice(0, 5).map((a) => a.areaCode);

  const allCodes = [
    ...new Set([
      ...quietCodes, ...localFavCodes, ...trendingCodes,
      ...foreignFavCodes, ...weekendPopCodes, ...peacefulCodes,
    ]),
  ];
  if (allCodes.length === 0) return empty;

  const { data: destinations } = await supabase
    .from("destinations")
    .select("content_id, title, addr1, first_image, area_code")
    .in("area_code", allCodes)
    .order("rating_avg", { ascending: false })
    .limit(80);

  const destMap = new Map<string, NonNullable<typeof destinations>[0]>();
  for (const d of destinations ?? []) {
    if (d && !destMap.has(d.area_code)) destMap.set(d.area_code, d);
  }

  function toCuration(codes: string[]): CurationDestination[] {
    return codes.flatMap((code) => {
      const dest = destMap.get(code);
      const area = areaMap.get(code);
      if (!dest || !area) return [];
      return [{
        contentId: dest.content_id, title: dest.title,
        addr1: dest.addr1, firstImage: dest.first_image,
        areaCode: code, areaNm: area.areaNm,
      }];
    });
  }

  return {
    quiet: toCuration(quietCodes),
    localFav: toCuration(localFavCodes),
    trending: toCuration(trendingCodes),
    foreignFav: toCuration(foreignFavCodes),
    weekendPop: toCuration(weekendPopCodes),
    peaceful: toCuration(peacefulCodes),
  };
}

// ─── 캐시 래핑 (데이터 1일 1회 갱신 기준) ─────────────────────
export const getVisitorTips = unstable_cache(
  _fetchVisitorTips,
  ["visitor-tips"],
  { revalidate: 86400, tags: ["visitor-stats"] }
);

export const getVisitorCuration = unstable_cache(
  _fetchVisitorCuration,
  ["visitor-curation"],
  { revalidate: 14400, tags: ["visitor-stats"] }
);
