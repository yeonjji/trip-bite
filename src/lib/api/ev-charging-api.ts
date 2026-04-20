const BASE_URL = "https://bigdata.kepco.co.kr/openapi/v1";

export interface EvCharger {
  statId: string;
  statNm: string;
  chgerId: string;
  chgerType: string;
  addr: string;
  lat: string;
  lng: string;
  useTime: string;
  busiNm: string;
  busiCall: string;
  // 충전기 상태: 1=통신이상, 2=충전대기, 3=충전중, 4=운영중지, 5=점검중
  stat: string;
  statUpdDt: string;
}

interface EvChargerListParams {
  metroCd?: string;
  pageNo?: number;
  numOfRows?: number;
}

interface EvChargerListResult {
  items: EvCharger[];
  totalCount: number;
}

// KEPCO 빅데이터 API 응답 구조 (공공데이터포털과 상이)
interface KepcoApiResponse {
  totalCount?: number;
  data?: EvCharger[];
  // 일부 버전은 response.body.items 구조일 수 있음
  response?: {
    body?: {
      items?: { item?: EvCharger[] } | "";
      totalCount?: number;
    };
    header?: {
      resultCode?: string;
      resultMsg?: string;
    };
  };
}

function getApiKey(): string {
  const key = process.env.KEPCO_API_KEY;
  if (!key) throw new Error("KEPCO_API_KEY 환경변수가 설정되지 않았습니다.");
  return key;
}

export const evApi = {
  async chargerList(params: EvChargerListParams = {}): Promise<EvChargerListResult> {
    const apiKey = getApiKey();
    const searchParams = new URLSearchParams();
    searchParams.set("apiKey", apiKey);
    if (params.metroCd) searchParams.set("metroCd", params.metroCd);
    if (params.pageNo !== undefined) searchParams.set("pageNo", String(params.pageNo));
    if (params.numOfRows !== undefined) searchParams.set("numOfRows", String(params.numOfRows));

    const url = `${BASE_URL}/EVchargeManage.do?${searchParams.toString()}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });

    if (!res.ok) {
      throw new Error(`KEPCO 전기차 충전소 API 요청 실패: ${res.status} ${res.statusText}`);
    }

    const data: KepcoApiResponse = await res.json();

    // 표준 공공데이터포털 형식인 경우
    if (data.response?.body) {
      const body = data.response.body;
      const items =
        body.items === "" || !body.items
          ? []
          : Array.isArray(body.items.item)
            ? body.items.item
            : body.items.item
              ? [body.items.item]
              : [];
      return { items, totalCount: body.totalCount ?? items.length };
    }

    // KEPCO 빅데이터 플랫폼 고유 형식인 경우
    if (Array.isArray(data.data)) {
      return { items: data.data, totalCount: data.totalCount ?? data.data.length };
    }

    return { items: [], totalCount: 0 };
  },
};
