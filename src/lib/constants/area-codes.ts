// P1-03: TourAPI 지역 코드 (17개 시도)

export interface AreaCode {
  code: string;
  nameKo: string;
  nameEn: string;
}

export const AREA_CODES: AreaCode[] = [
  { code: "11",    nameKo: "서울",  nameEn: "Seoul" },
  { code: "26",    nameKo: "부산",  nameEn: "Busan" },
  { code: "27",    nameKo: "대구",  nameEn: "Daegu" },
  { code: "28",    nameKo: "인천",  nameEn: "Incheon" },
  { code: "29",    nameKo: "광주",  nameEn: "Gwangju" },
  { code: "30",    nameKo: "대전",  nameEn: "Daejeon" },
  { code: "31",    nameKo: "울산",  nameEn: "Ulsan" },
  { code: "41",    nameKo: "경기",  nameEn: "Gyeonggi" },
  { code: "43",    nameKo: "충북",  nameEn: "Chungbuk" },
  { code: "44",    nameKo: "충남",  nameEn: "Chungnam" },
  { code: "46",    nameKo: "전남",  nameEn: "Jeonnam" },
  { code: "47",    nameKo: "경북",  nameEn: "Gyeongbuk" },
  { code: "48",    nameKo: "경남",  nameEn: "Gyeongnam" },
  { code: "50",    nameKo: "제주",  nameEn: "Jeju" },
  { code: "51",    nameKo: "강원",  nameEn: "Gangwon" },
  { code: "52",    nameKo: "전북",  nameEn: "Jeonbuk" },
  { code: "36110", nameKo: "세종",  nameEn: "Sejong" },
];

export const AREA_CODE_MAP = Object.fromEntries(
  AREA_CODES.map((a) => [a.code, a])
);

export const getAreaName = (code: string, locale: "ko" | "en" = "ko") => {
  const area = AREA_CODE_MAP[code];
  if (!area) return code;
  return locale === "ko" ? area.nameKo : area.nameEn;
};
