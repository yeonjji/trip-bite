// P4-02: 기상청 단기예보 격자좌표 (nx, ny) 매핑 - 17개 시도

// KorService2 area_code 기준 (014_update_regions_korservice2.sql 적용 후)
export const GRID_COORDS: Record<string, { nx: number; ny: number; cityName: string }> = {
  "11":    { nx: 60,  ny: 127, cityName: "서울" },
  "28":    { nx: 55,  ny: 124, cityName: "인천" },
  "30":    { nx: 67,  ny: 100, cityName: "대전" },
  "27":    { nx: 89,  ny: 90,  cityName: "대구" },
  "29":    { nx: 58,  ny: 74,  cityName: "광주" },
  "26":    { nx: 98,  ny: 76,  cityName: "부산" },
  "31":    { nx: 102, ny: 84,  cityName: "울산" },
  "36110": { nx: 66,  ny: 103, cityName: "세종" },
  "41":    { nx: 60,  ny: 120, cityName: "수원" },
  "51":    { nx: 73,  ny: 134, cityName: "춘천" },
  "43":    { nx: 69,  ny: 107, cityName: "청주" },
  "44":    { nx: 68,  ny: 100, cityName: "홍성" },
  "52":    { nx: 63,  ny: 89,  cityName: "전주" },
  "46":    { nx: 51,  ny: 67,  cityName: "무안" },
  "47":    { nx: 91,  ny: 106, cityName: "안동" },
  "48":    { nx: 90,  ny: 77,  cityName: "창원" },
  "50":    { nx: 52,  ny: 38,  cityName: "제주" },
};
