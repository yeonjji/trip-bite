import { evApi, type EvCharger } from "@/lib/api/ev-charging-api";

interface GetEvChargersParams {
  metroCd?: string;
  page?: number;
  pageSize?: number;
}

interface GetEvChargersResult {
  items: EvCharger[];
  totalCount: number;
}

export async function getEvChargers(
  params: GetEvChargersParams = {}
): Promise<GetEvChargersResult> {
  const { metroCd, page = 1, pageSize = 20 } = params;
  try {
    return await evApi.chargerList({ metroCd, pageNo: page, numOfRows: pageSize });
  } catch (error) {
    console.error("전기차 충전소 데이터 조회 실패:", error);
    return { items: [], totalCount: 0 };
  }
}

export type { EvCharger };
