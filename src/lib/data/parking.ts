import { getParkingLots, type ParkingLot } from "@/lib/api/parking-api";

interface GetParkingParams {
  zcode?: string;
  smprcSe?: string;
  page?: number;
  pageSize?: number;
}

interface GetParkingResult {
  items: ParkingLot[];
  totalCount: number;
  error?: string;
}

export async function getParking(params: GetParkingParams = {}): Promise<GetParkingResult> {
  const { zcode, smprcSe, page = 1, pageSize = 20 } = params;
  try {
    return await getParkingLots({ zcode, smprcSe, page, perPage: pageSize });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("주차장 데이터 조회 실패:", msg);
    return { items: [], totalCount: 0, error: msg };
  }
}

export type { ParkingLot };
