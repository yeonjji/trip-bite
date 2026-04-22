import { evApi, type EvCharger, type EvChargerStatus } from "@/lib/api/ev-charging-api";

interface GetEvChargersParams {
  zcode?: string;     // 시도 코드 ("11"=서울, "26"=부산 등)
  zscode?: string;    // 시군구 코드
  kind?: string;      // 충전기 종류 (01=급속, 02=완속)
  page?: number;
  pageSize?: number;
}

interface GetEvChargersResult {
  items: EvCharger[];
  totalCount: number;
  error?: string;
}

export interface EvStation {
  chargers: EvCharger[];
  statusMap: Record<string, EvChargerStatus>;
}

export async function getEvChargers(
  params: GetEvChargersParams = {}
): Promise<GetEvChargersResult> {
  const { zcode, zscode, kind, page = 1, pageSize = 20 } = params;
  try {
    return await evApi.chargerInfo({ zcode, zscode, kind, pageNo: page, numOfRows: pageSize });
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
