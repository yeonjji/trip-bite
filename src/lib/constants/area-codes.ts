// P1-03: TourAPI 지역 코드 (17개 시도)

export interface AreaCode {
  code: string;
  nameKo: string;
  nameEn: string;
}

export const AREA_CODES: AreaCode[] = [
  { code: "1",  nameKo: "서울",     nameEn: "Seoul" },
  { code: "2",  nameKo: "인천",     nameEn: "Incheon" },
  { code: "3",  nameKo: "대전",     nameEn: "Daejeon" },
  { code: "4",  nameKo: "대구",     nameEn: "Daegu" },
  { code: "5",  nameKo: "광주",     nameEn: "Gwangju" },
  { code: "6",  nameKo: "부산",     nameEn: "Busan" },
  { code: "7",  nameKo: "울산",     nameEn: "Ulsan" },
  { code: "8",  nameKo: "세종",     nameEn: "Sejong" },
  { code: "31", nameKo: "경기",     nameEn: "Gyeonggi" },
  { code: "32", nameKo: "강원",     nameEn: "Gangwon" },
  { code: "33", nameKo: "충북",     nameEn: "Chungbuk" },
  { code: "34", nameKo: "충남",     nameEn: "Chungnam" },
  { code: "35", nameKo: "전북",     nameEn: "Jeonbuk" },
  { code: "36", nameKo: "전남",     nameEn: "Jeonnam" },
  { code: "37", nameKo: "경북",     nameEn: "Gyeongbuk" },
  { code: "38", nameKo: "경남",     nameEn: "Gyeongnam" },
  { code: "39", nameKo: "제주",     nameEn: "Jeju" },
];

export const AREA_CODE_MAP = Object.fromEntries(
  AREA_CODES.map((a) => [a.code, a])
);

export const getAreaName = (code: string, locale: "ko" | "en" = "ko") => {
  const area = AREA_CODE_MAP[code];
  if (!area) return code;
  return locale === "ko" ? area.nameKo : area.nameEn;
};
