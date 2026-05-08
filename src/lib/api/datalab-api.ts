// 한국관광공사 관광빅데이터 정보서비스 (DataLabService) API 클라이언트
// 이동통신 데이터 기반 지자체별 방문자수 집계

const BASE_URL = "https://apis.data.go.kr/B551011/DataLabService";

function getCommonParams(): URLSearchParams {
  const key = process.env.PUBLIC_DATA_API_KEY;
  if (!key) throw new Error("PUBLIC_DATA_API_KEY 환경변수가 설정되지 않았습니다.");

  const params = new URLSearchParams();
  params.set("serviceKey", key);
  params.set("MobileOS", "ETC");
  params.set("MobileApp", "TripBite");
  params.set("_type", "json");
  return params;
}

interface DataLabResponse<T> {
  response: {
    header: { resultCode: string; resultMsg: string };
    body: {
      items: { item: T[] } | "";
      numOfRows: number;
      pageNo: number;
      totalCount: number;
    };
  };
}

async function fetchDataLab<T>(
  endpoint: string,
  params: URLSearchParams
): Promise<{ items: T[]; totalCount: number }> {
  const url = `${BASE_URL}/${endpoint}?${params.toString()}`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`DataLabService API 요청 실패: ${res.status} ${res.statusText}`);
  }

  const data: DataLabResponse<T> = await res.json();
  const { resultCode, resultMsg } = data.response.header;

  if (resultCode !== "0000") {
    throw new Error(`DataLabService API 오류 [${resultCode}]: ${resultMsg}`);
  }

  const body = data.response.body;
  const items = body.items === "" ? [] : Array.isArray(body.items.item) ? body.items.item : [body.items.item];
  return { items, totalCount: body.totalCount };
}

export interface MetroVisitorItem {
  areaCode: string;
  areaNm: string;
  daywkDivCd: string;
  daywkDivNm: string;
  touDivCd: string;
  touDivNm: string;
  touNum: number;
  baseYmd: string;
}

export interface LocalVisitorItem {
  signguCode: string;
  signguNm: string;
  daywkDivCd: string;
  daywkDivNm: string;
  touDivCd: string;
  touDivNm: string;
  touNum: number;
  baseYmd: string;
}

interface VisitorParams {
  startYmd: string;
  endYmd: string;
  numOfRows?: number;
  pageNo?: number;
}

export const datalabApi = {
  // 광역 지자체 지역방문자수 집계 (시도 단위)
  async metroVisitors(
    params: VisitorParams
  ): Promise<{ items: MetroVisitorItem[]; totalCount: number }> {
    const searchParams = getCommonParams();
    searchParams.set("startYmd", params.startYmd);
    searchParams.set("endYmd", params.endYmd);
    searchParams.set("numOfRows", String(params.numOfRows ?? 100));
    searchParams.set("pageNo", String(params.pageNo ?? 1));

    return fetchDataLab<MetroVisitorItem>("metcoRegnVisitrDDList", searchParams);
  },

  // 기초 지자체 지역방문자수 집계 (시군구 단위)
  async localVisitors(
    params: VisitorParams
  ): Promise<{ items: LocalVisitorItem[]; totalCount: number }> {
    const searchParams = getCommonParams();
    searchParams.set("startYmd", params.startYmd);
    searchParams.set("endYmd", params.endYmd);
    searchParams.set("numOfRows", String(params.numOfRows ?? 100));
    searchParams.set("pageNo", String(params.pageNo ?? 1));

    return fetchDataLab<LocalVisitorItem>("locgoRegnVisitrDDList", searchParams);
  },
};
