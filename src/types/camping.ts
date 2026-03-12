// P1-04: 고캠핑 API 캠핑장 타입

export interface CampingSiteBase {
  contentId: string;
  facltNm: string;         // 캠핑장명
  lineIntro?: string;      // 한줄소개
  intro?: string;          // 소개
  doNm: string;            // 도 이름
  sigunguNm: string;       // 시군구 이름
  zipcode?: string;
  addr1: string;           // 주소
  addr2?: string;
  mapX?: string;           // 경도
  mapY?: string;           // 위도
  tel?: string;
  homepage?: string;
  firstImageUrl?: string;  // 대표 이미지
  createdtime?: string;
  modifiedtime?: string;
}

export interface CampingSiteDetail extends CampingSiteBase {
  // 업종
  induty?: string;         // 일반야영장, 자동차야영장, 글램핑, 카라반
  // 부대시설
  sbrsCl?: string;         // 부대시설 (전기, 무선인터넷, 장작판매 등)
  sbrsEtc?: string;        // 기타 부대시설
  // 편의시설
  toiletCo?: number;       // 화장실 수
  swrmCo?: number;         // 샤워실 수
  wtrplCo?: number;        // 개수대 수
  // 사이트 정보
  gnrlSiteCo?: number;     // 일반 사이트 수
  autoSiteCo?: number;     // 자동차 사이트 수
  glampSiteCo?: number;    // 글램핑 사이트 수
  caravSiteCo?: number;    // 카라반 사이트 수
  // 바닥 재질
  siteBottomCl1?: number;  // 잔디
  siteBottomCl2?: number;  // 파쇄석
  siteBottomCl3?: number;  // 데크
  siteBottomCl4?: number;  // 자갈
  siteBottomCl5?: number;  // 맨흙
  // 반려동물
  animalCmgCl?: string;    // 동물 동반 가능 여부
  // 운영 시즌
  operPdCl?: string;       // 운영 기간
  operDeCl?: string;       // 운영 일자
  // 화로대
  brazierCl?: string;      // 화로대 여부 (개별/중앙/없음)
  // 위치 특성
  lctCl?: string;          // 입지 구분 (산, 숲, 계곡, 강/물가, 해변, 섬, 도심 등)
  // 테마
  themaEnvrnCl?: string;   // 테마환경
  // 예약
  resveCl?: string;        // 예약 구분
  resveUrl?: string;       // 예약 URL
  // 평점 (DB 집계)
  ratingAvg?: number;
  ratingCount?: number;
}

// 캠핑장 업종
export const CAMPING_INDUTY = {
  GENERAL: "일반야영장",
  AUTO: "자동차야영장",
  GLAMPING: "글램핑",
  CARAVAN: "카라반",
} as const;

export type CampingInduty = (typeof CAMPING_INDUTY)[keyof typeof CAMPING_INDUTY];

// 반려동물 동반 여부
export const CAMPING_ANIMAL = {
  POSSIBLE: "가능",
  SMALL_ONLY: "소형견만",
  IMPOSSIBLE: "불가",
} as const;
