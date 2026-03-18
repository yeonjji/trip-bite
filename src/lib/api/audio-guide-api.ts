// 오디오 가이드 API (한국관광공사 Odii 서비스)
// API 포털: https://www.data.go.kr/data/15101971/openapi.do
// Base URL: https://apis.data.go.kr/B551011/Odii

const BASE_URL = "https://apis.data.go.kr/B551011/Odii";

export interface AudioGuideItem {
  tid: string;
  tlid: string;
  themeCategory: string;
  addr1: string;
  addr2: string;
  title: string;
  mapX: string;
  mapY: string;
  langCheck: string;
  langCode: string;
  imageUrl: string;
  createdtime: string;
  modifiedtime: string;
}

interface AudioGuideApiResponse {
  response: {
    header: { resultCode: string; resultMsg: string };
    body: {
      items: unknown;
      numOfRows: number;
      pageNo: number;
      totalCount: number;
    };
  };
}

interface ListParams {
  numOfRows?: number;
  pageNo?: number;
  langCode?: string;
}

function getCommonParams(langCode = "ko"): URLSearchParams {
  const key = process.env.AUDIO_GUIDE_API_KEY;
  if (!key) throw new Error("AUDIO_GUIDE_API_KEY 환경변수가 설정되지 않았습니다.");

  const params = new URLSearchParams();
  params.set("serviceKey", key);
  params.set("MobileOS", "ETC");
  params.set("MobileApp", "TripBite");
  params.set("_type", "json");
  params.set("langCode", langCode);
  return params;
}

export const audioGuideApi = {
  async getList(params: ListParams): Promise<{ items: AudioGuideItem[]; totalCount: number }> {
    const searchParams = getCommonParams(params.langCode ?? "ko");
    if (params.numOfRows !== undefined) searchParams.set("numOfRows", String(params.numOfRows));
    if (params.pageNo !== undefined) searchParams.set("pageNo", String(params.pageNo));

    const url = `${BASE_URL}/themeBasedList?${searchParams.toString()}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });

    if (!res.ok) {
      throw new Error(`오디오 가이드 API 요청 실패: ${res.status} ${res.statusText}`);
    }

    const raw: unknown = await res.json();
    const anyData = raw as Record<string, unknown>;

    // 일부 에러는 response wrapper 없이 직접 resultCode/resultMsg 반환
    if (anyData.resultCode && anyData.resultCode !== "0000") {
      throw new Error(`오디오 가이드 API 오류 [${anyData.resultCode}]: ${anyData.resultMsg}`);
    }

    const data = raw as AudioGuideApiResponse;
    const body = data.response?.body;
    if (!body) throw new Error("오디오 가이드 API 응답 형식 오류");

    const itemsField = body.items as { item?: AudioGuideItem | AudioGuideItem[] } | null | undefined;
    const rawItems = itemsField?.item;
    const items: AudioGuideItem[] = !rawItems
      ? []
      : Array.isArray(rawItems)
        ? rawItems
        : [rawItems];

    return { items, totalCount: body.totalCount ?? 0 };
  },
};
