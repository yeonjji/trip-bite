import { evApi, type EvCharger, type EvChargerStatus } from "@/lib/api/ev-charging-api";

export interface EvStationSummary {
  statId: string;
  statNm: string;
  addr: string;
  lat: string;
  lng: string;
  busiNm: string;
  busiCall: string;
  useTime: string;
  parkingFree: string;
  limitYn: string;
  zcode: string;
  zscode: string;
  chargerCount: number;
  hasFast: boolean;
  hasSlow: boolean;
  maxOutput: number;
}

interface GetEvChargersParams {
  zcode?: string;
  zscode?: string;
  kind?: string;
  page?: number;
  pageSize?: number;
}

interface GetEvChargersResult {
  items: EvStationSummary[];
  totalCount: number;
  error?: string;
}

function groupByStation(chargers: EvCharger[]): EvStationSummary[] {
  const map = new Map<string, EvStationSummary>();
  for (const c of chargers) {
    const existing = map.get(c.statId);
    if (!existing) {
      map.set(c.statId, {
        statId: c.statId,
        statNm: c.statNm,
        addr: c.addr,
        lat: c.lat,
        lng: c.lng,
        busiNm: c.busiNm,
        busiCall: c.busiCall,
        useTime: c.useTime,
        parkingFree: c.parkingFree,
        limitYn: c.limitYn,
        zcode: c.zcode,
        zscode: c.zscode,
        chargerCount: 1,
        hasFast: c.kind === "01",
        hasSlow: c.kind === "02",
        maxOutput: Number(c.output) || 0,
      });
    } else {
      existing.chargerCount += 1;
      if (c.kind === "01") existing.hasFast = true;
      if (c.kind === "02") existing.hasSlow = true;
      existing.maxOutput = Math.max(existing.maxOutput, Number(c.output) || 0);
    }
  }
  return Array.from(map.values());
}

export interface EvStation {
  chargers: EvCharger[];
  statusMap: Record<string, EvChargerStatus>;
}

// 충전소 단위로 묶어서 반환 (API는 충전기 단위로 반환하므로 그룹핑)
const CHARGERS_PER_STATION = 5;

export async function getEvChargers(
  params: GetEvChargersParams = {}
): Promise<GetEvChargersResult> {
  const { zcode, zscode, kind, page = 1, pageSize = 30 } = params;
  try {
    const result = await evApi.chargerInfo({
      zcode,
      zscode,
      kind,
      pageNo: page,
      numOfRows: pageSize * CHARGERS_PER_STATION,
    });

    const stations = groupByStation(result.items);
    const approxTotal = Math.ceil(result.totalCount / CHARGERS_PER_STATION);

    return {
      items: stations.slice(0, pageSize),
      totalCount: approxTotal,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("전기차 충전소 데이터 조회 실패:", msg);
    return { items: [], totalCount: 0, error: msg };
  }
}

export async function getEvStation(statId: string): Promise<EvStation | null> {
  try {
    const [infoResult, statusResult] = await Promise.all([
      evApi.chargerInfo({ statId, numOfRows: 100 }),
      evApi.chargerStatus({ statId, numOfRows: 100 }),
    ]);

    if (infoResult.items.length === 0) return null;

    const statusMap: Record<string, EvChargerStatus> = {};
    for (const s of statusResult.items) {
      statusMap[s.chgerId] = s;
    }

    return { chargers: infoResult.items, statusMap };
  } catch (error) {
    console.error("전기차 충전소 상세 조회 실패:", error);
    return null;
  }
}

export async function getEvChargerStatus(statId: string): Promise<EvChargerStatus[]> {
  try {
    const { items } = await evApi.chargerStatus({ statId });
    return items;
  } catch (error) {
    console.error("전기차 충전기 상태 조회 실패:", error);
    return [];
  }
}

export type { EvCharger, EvChargerStatus };

