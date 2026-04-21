// P1-15, P1-16: 고캠핑 API 클라이언트

import type { CampingSiteBase, CampingSiteDetail } from "@/types/camping";
import type { ApiResponse } from "@/types/tour-api";

const BASE_URL = "https://apis.data.go.kr/B551011/GoCamping";

interface CampingImage {
  contentId: string;
  imageUrl: string;
}

interface BasedListParams {
  numOfRows?: number;
  pageNo?: number;
  doNm?: string;
  sigunguNm?: string;
}

interface SearchListParams {
  keyword: string;
  numOfRows?: number;
  pageNo?: number;
}

interface ListResult<T> {
  items: T[];
  totalCount: number;
}

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

async function fetchCampingApi<T>(endpoint: string, params: URLSearchParams): Promise<ApiResponse<T>> {
  const url = `${BASE_URL}/${endpoint}?${params.toString()}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });

  if (!res.ok) {
    throw new Error(`고캠핑 API 요청 실패: ${res.status} ${res.statusText}`);
  }

  const data: ApiResponse<T> = await res.json();
  const { resultCode, resultMsg } = data.response.header;

  if (resultCode !== "0000") {
    throw new Error(`고캠핑 API 오류 [${resultCode}]: ${resultMsg}`);
  }

  return data;
}

function extractItems<T>(data: ApiResponse<T>): { items: T[]; totalCount: number } {
  const body = data.response.body;
  const items = body.items === "" ? [] : body.items.item;
  return { items, totalCount: body.totalCount };
}

export const campingApi = {
  // P1-15: 지역 기반 목록 조회
  async basedList(params: BasedListParams): Promise<ListResult<CampingSiteBase>> {
    const searchParams = getCommonParams();
    if (params.numOfRows !== undefined) searchParams.set("numOfRows", String(params.numOfRows));
    if (params.pageNo !== undefined) searchParams.set("pageNo", String(params.pageNo));
    if (params.doNm) searchParams.set("doNm", params.doNm);
    if (params.sigunguNm) searchParams.set("sigunguNm", params.sigunguNm);

    const data = await fetchCampingApi<CampingSiteBase>("basedList", searchParams);
    return extractItems(data);
  },

  // P1-15: 키워드 검색
  async searchList(params: SearchListParams): Promise<ListResult<CampingSiteBase>> {
    const searchParams = getCommonParams();
    searchParams.set("keyword", params.keyword);
    if (params.numOfRows !== undefined) searchParams.set("numOfRows", String(params.numOfRows));
    if (params.pageNo !== undefined) searchParams.set("pageNo", String(params.pageNo));

    const data = await fetchCampingApi<CampingSiteBase>("searchList", searchParams);
    return extractItems(data);
  },

  // P1-16: 캠핑장 상세 조회
  async detailList(contentId: string): Promise<CampingSiteDetail> {
    const searchParams = getCommonParams();
    searchParams.set("contentId", contentId);

    const data = await fetchCampingApi<CampingSiteDetail>("detailList", searchParams);
    const { items } = extractItems(data);

    if (items.length === 0) {
      throw new Error(`캠핑장 상세 정보를 찾을 수 없습니다: ${contentId}`);
    }

    return items[0];
  },

  // P1-16: 캠핑장 이미지 조회
  async imageList(contentId: string): Promise<CampingImage[]> {
    const searchParams = getCommonParams();
    searchParams.set("contentId", contentId);

    const data = await fetchCampingApi<{ contentId: string; imageUrl: string }>(
      "imageList",
      searchParams
    );
    const { items } = extractItems(data);
    return items;
  },
};
