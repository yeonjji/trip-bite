// P4-08: 계절/날씨 기반 추천 유틸리티

/**
 * 현재 월을 기준으로 계절 반환
 */
export function getCurrentSeason(): "봄" | "여름" | "가을" | "겨울" {
  const month = new Date().getMonth() + 1 // 1~12

  if (month >= 3 && month <= 5) return "봄"
  if (month >= 6 && month <= 8) return "여름"
  if (month >= 9 && month <= 11) return "가을"
  return "겨울"
}

/**
 * 현재 제철 특산품 시즌 레이블 반환
 */
export function getCurrentSeasonLabel(): string {
  return getCurrentSeason()
}

/**
 * 날씨 기반 추천 contentTypeId 목록 반환
 *
 * sky: "1"=맑음, "3"=구름많음, "4"=흐림
 * pty: "0"=없음, "1"=비, "2"=비/눈, "3"=눈, "4"=소나기
 */
export function getWeatherRecommendation(sky: string, pty: string): string[] {
  // 비 또는 눈
  if (pty !== "0") {
    return [
      "14", // 문화시설 (박물관, 미술관)
      "38", // 쇼핑
      "39", // 음식점
    ]
  }

  // 맑음
  if (sky === "1") {
    return [
      "12", // 관광지
      "28", // 레포츠
      "15", // 축제/공연/행사
    ]
  }

  // 구름많음 또는 흐림
  return [
    "12", // 관광지
    "14", // 문화시설
    "39", // 음식점
  ]
}
