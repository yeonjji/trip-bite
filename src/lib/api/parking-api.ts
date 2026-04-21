// 전국주차장정보표준데이터 API (공공데이터포털 tn_pubr_prkplce_info_api)

const BASE_URL = "https://api.data.go.kr/openapi/tn_pubr_prkplce_info_api";

export interface ParkingLot {
  prkplceNo: string;             // 주차장 관리 번호
  prkplceNm: string;             // 주차장명
  prkplceSe: string;             // 주차장 구분 (노상/노외/부설/기계식)
  adres: string;                 // 소재지 지번주소
  rdnmadr: string;               // 소재지 도로명주소
  lat: string;                   // 위도
  lon: string;                   // 경도
  prkcpa: string;                // 주차 구획 수 (총 주차면수)
  smprcSe: string;               // 주차 무료 구분 (무료/유료)
  bsrtfee: string;               // 기본 주차 요금 (원)
  addtchrge: string;             // 추가 단위 요금 (원)
  weekdayOperOpenHhmm: string;   // 평일 운영 시작 시각 (HHmm)
  weekdayOperColseHhmm: string;  // 평일 운영 종료 시각 (HHmm)
  satOperOperOpenHhmm: string;   // 토요일 운영 시작 시각
  satOperCloseHhmm: string;      // 토요일 운영 종료 시각
  holidayOperOpenHhmm: string;   // 공휴일 운영 시작 시각
  holidayCloseOpenHhmm: string;  // 공휴일 운영 종료 시각
  rfPrkPlc: string;              // 장애인 전용 구획 수
  phoneNumber: string;           // 전화번호
  ctprvnNm: string;              // 시도명
  sigunguNm: string;             // 시군구명
}

// 법정동 area code → 공공데이터 시도명 매핑
const AREA_CODE_TO_PROVINCE: Record<string, string> = {
  "11": "서울특별시",
  "26": "부산광역시",
  "27": "대구광역시",
  "28": "인천광역시",
  "29": "광주광역시",
  "30": "대전광역시",
  "31": "울산광역시",
  "41": "경기도",
  "43": "충청북도",
  "44": "충청남도",
  "46": "전라남도",
  "47": "경상북도",
  "48": "경상남도",
  "50": "제주특별자치도",
  "51": "강원특별자치도",
  "52": "전북특별자치도",
  "36110": "세종특별자치시",
};

interface GetParkingParams {
  zcode?: string;      // 법정동 시도 코드 (area-codes.ts 기준)
  smprcSe?: string;    // 무료/유료 구분
  page?: number;
  perPage?: number;
}

interface ParkingApiResponse {
  currentCount: number;
  data: ParkingLot[];
  matchCount: number;
  page: number;
  perPage: number;
  totalCount: number;
}

interface ListResult {
  items: ParkingLot[];
  totalCount: number;
}

function getServiceKey(): string {
  const key = process.env.PARKING_API_KEY;
  if (!key) throw new Error("PARKING_API_KEY 환경변수가 설정되지 않았습니다.");
  return key;
}

export async function getParkingLots(params: GetParkingParams = {}): Promise<ListResult> {
  const { zcode, smprcSe, page = 1, perPage = 20 } = params;

  const searchParams = new URLSearchParams();
  searchParams.set("serviceKey", getServiceKey());
  searchParams.set("page", String(page));
  searchParams.set("perPage", String(perPage));
  searchParams.set("returnType", "JSON");

  if (zcode) {
    const province = AREA_CODE_TO_PROVINCE[zcode];
    if (province) searchParams.set("cond[ctprvnNm::EQ]", province);
  }
  if (smprcSe) {
    searchParams.set("cond[smprcSe::EQ]", smprcSe);
  }

  const url = `${BASE_URL}?${searchParams.toString()}`;
  const res = await fetch(url, { next: { revalidate: 86400 } }); // 하루 캐싱 (주차장 정보는 자주 안 바뀜)

  if (!res.ok) {
    throw new Error(`주차장 API 요청 실패: ${res.status} ${res.statusText}`);
  }

  const data: ParkingApiResponse = await res.json();
  return { items: data.data ?? [], totalCount: data.totalCount ?? 0 };
}
