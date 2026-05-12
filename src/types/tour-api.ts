// P1-01: TourAPI 4.0 공통 응답 타입
// P1-02: TourAPI 여행지/맛집 엔티티 타입

export interface ApiHeader {
  resultCode: string;
  resultMsg: string;
}

export interface ApiBody<T> {
  items: { item: T[] } | "";
  numOfRows: number;
  pageNo: number;
  totalCount: number;
}

export interface ApiResponse<T> {
  response: {
    header: ApiHeader;
    body: ApiBody<T>;
  };
}

// 공통 목록 조회 파라미터
export interface TourApiListParams {
  numOfRows?: number;
  pageNo?: number;
  areaCode?: string;
  sigunguCode?: string;
  contentTypeId?: string;
  arrange?: "A" | "B" | "C" | "D" | "E" | "O" | "Q"; // A:제목순 B:조회순 C:수정일순 D:생성일순 E:거리순 O/Q:이미지 우선
  mapX?: number;
  mapY?: number;
  radius?: number;
  cat3?: string;
  keyword?: string;
}

// P1-02: TourSpotBase - 여행지/맛집 공통 기본 필드
export interface TourSpotBase {
  contentid: string;
  contenttypeid: string;
  title: string;
  addr1: string;
  addr2?: string;
  areacode: string;
  sigungucode?: string;
  firstimage?: string;
  firstimage2?: string;
  mapx?: string;
  mapy?: string;
  tel?: string;
  telname?: string;
  homepage?: string;
  overview?: string;
  createdtime?: string;
  modifiedtime?: string;
  readcount?: number;
}

// 여행지 상세 (contentTypeId: 12)
export interface TourSpotDetail extends TourSpotBase {
  heritage1?: string;
  heritage2?: string;
  heritage3?: string;
  infocenter?: string;
  opendate?: string;
  restdate?: string;
  expguide?: string;
  expagerange?: string;
  accomcount?: string;
  useseason?: string;
  usetime?: string;
  parking?: string;
  chkbabycarriage?: string;
  chkpet?: string;
  chkcreditcard?: string;
}

// 맛집 상세 (contentTypeId: 39)
export interface RestaurantDetail extends TourSpotBase {
  firstmenu?: string;
  treatmenu?: string;
  opentimefood?: string;
  restdatefood?: string;
  parkingfood?: string;
  reservationfood?: string;
  chkcreditcardfood?: string;
  kidsfacility?: string;
  seat?: string;
  smoking?: string;
  packing?: string;
  incoursetime?: string;
  lcnsno?: string;
}

// 이미지 정보
export interface TourImage {
  contentid: string;
  imgname: string;
  originimgurl: string;
  smallimageurl: string;
  cpyrhtDivCd: string;
  serialnum: string;
}

// detailCommon 응답
export interface TourDetailCommon {
  contentid: string;
  contenttypeid: string;
  title: string;
  homepage?: string;
  overview?: string;
  booktour?: string;
  createdtime: string;
  modifiedtime: string;
  telname?: string;
  tel?: string;
  addr1?: string;
  addr2?: string;
  zipcode?: string;
  mapx?: string;
  mapy?: string;
  mlevel?: string;
  firstimage?: string;
  firstimage2?: string;
}

// detailPetTour 응답
export interface TourPetInfo {
  contentid: string;
  relafrpetspecies?: string;
  acmpanypetpossible?: string;
  acmpanypetsizerange?: string;
  relaacmpanypetfee?: string;
  acmpanypetcount?: string;
  petaceptdivision?: string;
  petinfo?: string;
  exprdpetaceptdivision?: string;
  exprdpetaceptdivisionetc?: string;
}
