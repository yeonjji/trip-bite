// P1-12, P1-13, P1-14: TourAPI 4.0 클라이언트

import type {
  ApiResponse,
  TourApiListParams,
  TourSpotBase,
  TourSpotDetail,
  RestaurantDetail,
  TourImage,
  TourDetailCommon,
  TourPetInfo,
} from "@/types/tour-api";

const BASE_URL = "https://apis.data.go.kr/B551011/KorService2";

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

async function fetchTourApi<T>(endpoint: string, params: URLSearchParams): Promise<ApiResponse<T>> {
  const url = `${BASE_URL}/${endpoint}?${params.toString()}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });

  if (!res.ok) {
    throw new Error(`TourAPI 요청 실패: ${res.status} ${res.statusText}`);
  }

  const data: ApiResponse<T> = await res.json();
  const { resultCode, resultMsg } = data.response.header;

  if (resultCode !== "0000") {
    throw new Error(`TourAPI 오류 [${resultCode}]: ${resultMsg}`);
  }

  return data;
}

export const tourApi = {
  // P1-12: 지역 기반 목록 조회
  areaBasedList(params: TourApiListParams): Promise<ApiResponse<TourSpotBase>> {
    const searchParams = getCommonParams();
    if (params.numOfRows !== undefined) searchParams.set("numOfRows", String(params.numOfRows));
    if (params.pageNo !== undefined) searchParams.set("pageNo", String(params.pageNo));
    if (params.areaCode) searchParams.set("lDongRegnCd", params.areaCode);
    if (params.sigunguCode) searchParams.set("sigunguCode", params.sigunguCode);
    if (params.contentTypeId) searchParams.set("contentTypeId", params.contentTypeId);
    if (params.arrange) searchParams.set("arrange", params.arrange);

    return fetchTourApi<TourSpotBase>("areaBasedList2", searchParams);
  },

  // P1-13: 키워드 검색
  searchKeyword(params: TourApiListParams): Promise<ApiResponse<TourSpotBase>> {
    const searchParams = getCommonParams();
    if (params.numOfRows !== undefined) searchParams.set("numOfRows", String(params.numOfRows));
    if (params.pageNo !== undefined) searchParams.set("pageNo", String(params.pageNo));
    if (params.areaCode) searchParams.set("lDongRegnCd", params.areaCode);
    if (params.sigunguCode) searchParams.set("sigunguCode", params.sigunguCode);
    if (params.contentTypeId) searchParams.set("contentTypeId", params.contentTypeId);
    if (params.arrange) searchParams.set("arrange", params.arrange);
    if (params.keyword) searchParams.set("keyword", params.keyword);

    return fetchTourApi<TourSpotBase>("searchKeyword2", searchParams);
  },

  // 위치 기반 관광정보 조회
  locationBasedList(params: TourApiListParams): Promise<ApiResponse<TourSpotBase>> {
    const searchParams = getCommonParams();
    if (params.numOfRows !== undefined) searchParams.set("numOfRows", String(params.numOfRows));
    if (params.pageNo !== undefined) searchParams.set("pageNo", String(params.pageNo));
    if (params.contentTypeId) searchParams.set("contentTypeId", params.contentTypeId);
    if (params.arrange) searchParams.set("arrange", params.arrange);
    if (params.mapX !== undefined) searchParams.set("mapX", String(params.mapX));
    if (params.mapY !== undefined) searchParams.set("mapY", String(params.mapY));
    if (params.radius !== undefined) searchParams.set("radius", String(params.radius));
    if (params.cat3) searchParams.set("cat3", params.cat3);

    return fetchTourApi<TourSpotBase>("locationBasedList2", searchParams);
  },

  // P1-14: 공통 상세 조회
  detailCommon(contentId: string): Promise<ApiResponse<TourDetailCommon>> {
    const searchParams = getCommonParams();
    searchParams.set("contentId", contentId);
    searchParams.set("defaultYN", "Y");
    searchParams.set("firstImageYN", "Y");
    searchParams.set("areacodeYN", "Y");
    searchParams.set("addrinfoYN", "Y");
    searchParams.set("mapinfoYN", "Y");
    searchParams.set("overviewYN", "Y");

    return fetchTourApi<TourDetailCommon>("detailCommon2", searchParams);
  },

  // P1-14: 소개 상세 조회
  detailIntro(
    contentId: string,
    contentTypeId: string
  ): Promise<ApiResponse<TourSpotDetail | RestaurantDetail>> {
    const searchParams = getCommonParams();
    searchParams.set("contentId", contentId);
    searchParams.set("contentTypeId", contentTypeId);

    return fetchTourApi<TourSpotDetail | RestaurantDetail>("detailIntro2", searchParams);
  },

  // P1-14: 이미지 조회
  detailImage(contentId: string): Promise<ApiResponse<TourImage>> {
    const searchParams = getCommonParams();
    searchParams.set("contentId", contentId);
    searchParams.set("imageYN", "Y");
    searchParams.set("subImageYN", "Y");

    return fetchTourApi<TourImage>("detailImage2", searchParams);
  },

  // P1-14: 반려동물 여행 정보 조회
  detailPetTour(contentId: string): Promise<ApiResponse<TourPetInfo>> {
    const searchParams = getCommonParams();
    searchParams.set("contentId", contentId);

    return fetchTourApi<TourPetInfo>("detailPetTour2", searchParams);
  },

  // P3-02: 외국어 안내 정보 조회
  detailWithTour(contentId: string): Promise<ApiResponse<Record<string, string>>> {
    const searchParams = getCommonParams();
    searchParams.set("contentId", contentId);

    return fetchTourApi<Record<string, string>>("detailWithTour2", searchParams);
  },
};
