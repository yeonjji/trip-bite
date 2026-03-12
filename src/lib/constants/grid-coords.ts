// P4-02: 기상청 단기예보 격자좌표 (nx, ny) 매핑 - 17개 시도

export const GRID_COORDS: Record<string, { nx: number; ny: number; cityName: string }> = {
  "1":  { nx: 60,  ny: 127, cityName: "서울" },
  "2":  { nx: 55,  ny: 124, cityName: "인천" },
  "3":  { nx: 67,  ny: 100, cityName: "대전" },
  "4":  { nx: 89,  ny: 90,  cityName: "대구" },
  "5":  { nx: 58,  ny: 74,  cityName: "광주" },
  "6":  { nx: 98,  ny: 76,  cityName: "부산" },
  "7":  { nx: 102, ny: 84,  cityName: "울산" },
  "8":  { nx: 66,  ny: 103, cityName: "세종" },
  "31": { nx: 60,  ny: 120, cityName: "수원" },
  "32": { nx: 73,  ny: 134, cityName: "춘천" },
  "33": { nx: 69,  ny: 107, cityName: "청주" },
  "34": { nx: 68,  ny: 100, cityName: "홍성" },
  "35": { nx: 63,  ny: 89,  cityName: "전주" },
  "36": { nx: 51,  ny: 67,  cityName: "무안" },
  "37": { nx: 91,  ny: 106, cityName: "안동" },
  "38": { nx: 90,  ny: 77,  cityName: "창원" },
  "39": { nx: 52,  ny: 38,  cityName: "제주" },
};
