// P2-03: COOKRCP01 레시피 API 클라이언트

import type { CookRcpItem, CookRcpApiResponse } from "@/types/recipe";

function getBaseUrl(): string {
  const apiKey = process.env.RECIPE_API_KEY;
  if (!apiKey) throw new Error("RECIPE_API_KEY 환경변수가 설정되지 않았습니다.");
  return `https://openapi.foodsafetykorea.go.kr/api/${apiKey}/COOKRCP01/json`;
}

interface ListResult {
  items: CookRcpItem[];
  totalCount: number;
}

async function fetchRecipeApi(url: string): Promise<CookRcpApiResponse> {
  const res = await fetch(url, { next: { revalidate: 86400 } });

  if (!res.ok) {
    throw new Error(`COOKRCP01 API 요청 실패: ${res.status} ${res.statusText}`);
  }

  const data: CookRcpApiResponse = await res.json();
  const { CODE, MSG } = data.COOKRCP01.RESULT;

  if (CODE !== "INFO-000") {
    throw new Error(`COOKRCP01 API 오류 [${CODE}]: ${MSG}`);
  }

  return data;
}

function extractResult(data: CookRcpApiResponse): ListResult {
  const { row, total_count } = data.COOKRCP01;
  return {
    items: row ?? [],
    totalCount: parseInt(total_count, 10) || 0,
  };
}

export const recipeApi = {
  // 레시피 목록 (startIdx~endIdx)
  async getList(startIdx: number, endIdx: number): Promise<ListResult> {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/${startIdx}/${endIdx}`;
    const data = await fetchRecipeApi(url);
    return extractResult(data);
  },

  // 키워드 검색
  async searchByName(
    keyword: string,
    startIdx: number = 1,
    endIdx: number = 100
  ): Promise<ListResult> {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/${startIdx}/${endIdx}/RCP_NM/${encodeURIComponent(keyword)}`;
    const data = await fetchRecipeApi(url);
    return extractResult(data);
  },
};
