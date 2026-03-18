// 한국관광공사_관광지 오디오 가이드정보_GW (Odii API)

import type { OdiiApiItem, OdiiApiResponse } from "@/types/audio-guide";

const BASE_URL = "https://apis.data.go.kr/B551011/Odii";

function getCommonParams(): URLSearchParams {
  const key = process.env.AUDIO_GUIDE_API_KEY;
  if (!key) throw new Error("AUDIO_GUIDE_API_KEY 환경변수가 설정되지 않았습니다.");

  const params = new URLSearchParams();
  params.set("serviceKey", key);
  params.set("MobileOS", "ETC");
  params.set("MobileApp", "TripBite");
  params.set("_type", "json");
  return params;
}

async function fetchOdiiApi(endpoint: string, params: URLSearchParams): Promise<OdiiApiResponse> {
  const url = `${BASE_URL}/${endpoint}?${params.toString()}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });

  if (!res.ok) {
    throw new Error(`Odii API 요청 실패: ${res.status} ${res.statusText}`);
  }

  const data: OdiiApiResponse = await res.json();
  const { resultCode, resultMsg } = data.response.header;

  if (resultCode !== "0000") {
    throw new Error(`Odii API 오류 [${resultCode}]: ${resultMsg}`);
  }

  return data;
}

export const audioGuideApi = {
  // 오디오 가이드 목록 조회
  async getList(params: {
    numOfRows?: number;
    pageNo?: number;
    areaCode?: string;
    sigunguCode?: string;
    keyword?: string;
  }): Promise<{ items: OdiiApiItem[]; totalCount: number }> {
    const searchParams = getCommonParams();
    if (params.numOfRows !== undefined) searchParams.set("numOfRows", String(params.numOfRows));
    if (params.pageNo !== undefined) searchParams.set("pageNo", String(params.pageNo));
    if (params.areaCode) searchParams.set("areaCode", params.areaCode);
    if (params.sigunguCode) searchParams.set("sigunguCode", params.sigunguCode);
    if (params.keyword) searchParams.set("keyword", params.keyword);

    const data = await fetchOdiiApi("getOdiiList", searchParams);
    const body = data.response.body;

    if (!body.items || typeof body.items === "string") {
      return { items: [], totalCount: 0 };
    }

    const raw = body.items.item;
    const items = Array.isArray(raw) ? raw : [raw];
    return { items, totalCount: body.totalCount };
  },
};
