import { createClient } from "@/lib/supabase/server";
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

export interface EvStation {
  chargers: EvCharger[];
  statusMap: Record<string, EvChargerStatus>;
}

// 충전소 목록 조회 (Supabase ev_stations 뷰 사용)
export async function getEvChargers(
  params: GetEvChargersParams = {}
): Promise<GetEvChargersResult> {
  const { zcode, zscode, kind, page = 1, pageSize = 30 } = params;

  try {
    const supabase = await createClient();

    let query = supabase
      .from("ev_stations")
      .select("*", { count: "estimated" })
      .order("stat_id", { ascending: true })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (zcode) query = query.eq("zcode", zcode);
    if (zscode) query = query.eq("zscode", zscode);
    if (kind === "01") query = query.eq("has_fast", true);
    if (kind === "02") query = query.eq("has_slow", true);

    const { data, count, error } = await query;

    if (error) {
      console.error("전기차 충전소 데이터 조회 실패:", error.message);
      return { items: [], totalCount: 0, error: error.message };
    }

    const items: EvStationSummary[] = (data ?? []).map((row) => ({
      statId:       row.stat_id,
      statNm:       row.stat_nm ?? "",
      addr:         row.addr ?? "",
      lat:          String(row.lat ?? ""),
      lng:          String(row.lng ?? ""),
      busiNm:       row.busi_nm ?? "",
      busiCall:     row.busi_call ?? "",
      useTime:      row.use_time ?? "",
      parkingFree:  row.parking_free ?? "",
      limitYn:      row.limit_yn ?? "",
      zcode:        row.zcode ?? "",
      zscode:       row.zscode ?? "",
      chargerCount: Number(row.charger_count ?? 0),
      hasFast:      row.has_fast ?? false,
      hasSlow:      row.has_slow ?? false,
      maxOutput:    Number(row.max_output ?? 0),
    }));

    return { items, totalCount: count ?? 0 };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("전기차 충전소 데이터 조회 실패:", msg);
    return { items: [], totalCount: 0, error: msg };
  }
}

// 충전소 상세 조회: 충전기 정보는 Supabase, 실시간 상태는 API 직접 호출
export async function getEvStation(statId: string): Promise<EvStation | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("ev_chargers")
      .select("*")
      .eq("stat_id", statId)
      .neq("del_yn", "Y");

    if (error || !data || data.length === 0) return null;

    const chargers: EvCharger[] = data.map((row) => ({
      statId:      row.stat_id,
      statNm:      row.stat_nm ?? "",
      chgerId:     row.chger_id,
      chgerType:   row.chger_type ?? "",
      addr:        row.addr ?? "",
      lat:         String(row.lat ?? ""),
      lng:         String(row.lng ?? ""),
      useTime:     row.use_time ?? "",
      busiId:      row.busi_id ?? "",
      bnm:         row.bnm ?? "",
      busiNm:      row.busi_nm ?? "",
      busiCall:    row.busi_call ?? "",
      output:      String(row.output ?? ""),
      method:      row.method ?? "",
      zcode:       row.zcode ?? "",
      zscode:      row.zscode ?? "",
      kind:        row.kind ?? "",
      kindDetail:  row.kind_detail ?? "",
      parkingFree: row.parking_free ?? "",
      limitYn:     row.limit_yn ?? "",
      limitDetail: row.limit_detail ?? "",
      delYn:       row.del_yn ?? "",
      note:        row.note ?? "",
    }));

    // 실시간 충전기 상태는 API 직접 호출
    const statusResult = await evApi.chargerStatus({ statId, numOfRows: 100 });
    const statusMap: Record<string, EvChargerStatus> = {};
    for (const s of statusResult.items) {
      statusMap[s.chgerId] = s;
    }

    return { chargers, statusMap };
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
