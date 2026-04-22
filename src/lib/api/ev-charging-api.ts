// 한국환경공단 전기자동차 충전소 정보 API (공공데이터포털 B552584)

const BASE_URL = "https://apis.data.go.kr/B552584/EvCharger";

export interface EvCharger {
  statId: string;       // 충전소 ID
  statNm: string;       // 충전소명
  chgerId: string;      // 충전기 ID
  chgerType: string;    // 충전기 타입 (01~07)
  addr: string;         // 주소
  lat: string;          // 위도
  lng: string;          // 경도
  useTime: string;      // 이용가능시간
  busiId: string;       // 운영기관 ID
  bnm: string;          // 운영기관명(사업자)
  busiNm: string;       // 충전소 운영기관명
  busiCall: string;     // 운영기관 연락처
  output: string;       // 충전용량 (kW)
  method: string;       // 충전방식
  zcode: string;        // 시도 코드
  zscode: string;       // 시군구 코드
  kind: string;         // 충전기 종류 (01=급속, 02=완속)
  kindDetail: string;   // 충전기 종류 상세
  parkingFree: string;  // 주차비 무료 여부 (Y/N)
  limitYn: string;      // 이용자 제한 여부 (Y/N)
  limitDetail: string;  // 이용자 제한 상세
  delYn: string;        // 삭제 여부 (Y/N)
  note: string;         // 비고
}

export interface EvChargerStatus {
  statId: string;       // 충전소 ID
  chgerId: string;      // 충전기 ID
  // 상태: 1=통신이상, 2=충전대기, 3=충전중, 4=운영중지, 5=점검중, 9=삭제
  stat: string;
  statUpdDt: string;    // 상태 갱신일시 (yyyyMMddHHmmss)
  lastTsdt: string;     // 마지막 충전 시작일시
  lastTedt: string;     // 마지막 충전 종료일시
  nowTsdt: string;      // 현재 충전 시작일시
}

interface ChargerInfoParams {
  zcode?: string;       // 시도 코드 (법정동 코드와 동일: "11"=서울, "26"=부산 등)
  zscode?: string;      // 시군구 코드
  kind?: string;        // 충전기 종류 (01=급속, 02=완속)
  pageNo?: number;
  numOfRows?: number;
}

interface ChargerStatusParams {
  statId?: string;      // 특정 충전소 ID
  pageNo?: number;
  numOfRows?: number;
}

interface ListResult<T> {
  items: T[];
  totalCount: number;
}

interface ApiResponse<T> {
  response: {
    header: { resultCode: string; resultMsg: string };
    body: {
      items: { item: T[] | T } | "";
      totalCount: number;
      numOfRows: number;
      pageNo: number;
    };
  };
}

function getServiceKey(): string {
  const key = process.env.PUBLIC_DATA_API_KEY;
  if (!key) throw new Error("PUBLIC_DATA_API_KEY 환경변수가 설정되지 않았습니다.");
  return key;
}

function getCommonParams(): URLSearchParams {
  const params = new URLSearchParams();
  params.set("serviceKey", getServiceKey());
  params.set("_type", "json");
  return params;
}

async function fetchEvApi<T>(endpoint: string, params: URLSearchParams): Promise<ListResult<T>> {
  const url = `${BASE_URL}/${endpoint}?${params.toString()}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });

  if (!res.ok) {
    throw new Error(`전기차 충전소 API 요청 실패: ${res.status} ${res.statusText}`);
  }

  const text = await res.text();

  // data.go.kr 인증 실패 시 XML 에러 반환 처리
  if (text.trimStart().startsWith("<")) {
    const codeMatch = text.match(/<returnReasonCode>(\d+)<\/returnReasonCode>/);
    const msgMatch = text.match(/<returnAuthMsg>([^<]+)<\/returnAuthMsg>/);
    const code = codeMatch?.[1] ?? "?";
    const msg = msgMatch?.[1] ?? "XML error";
    throw new Error(`EV충전소 API 인증 오류 [code ${code}]: ${msg} — data.go.kr에서 해당 API 활용신청 여부를 확인하세요.`);
  }

  const data: ApiResponse<T> = JSON.parse(text);
  const { resultCode, resultMsg } = data.response.header;

  if (resultCode !== "00") {
    throw new Error(`전기차 충전소 API 오류 [${resultCode}]: ${resultMsg}`);
  }

  const body = data.response.body;
  if (body.items === "" || !body.items) {
    return { items: [], totalCount: body.totalCount };
  }
  const raw = body.items.item;
  const items = Array.isArray(raw) ? raw : [raw];
  return { items, totalCount: body.totalCount };
}

export const evApi = {
  // 충전기 정보 조회
  async chargerInfo(params: ChargerInfoParams = {}): Promise<ListResult<EvCharger>> {
    const searchParams = getCommonParams();
    if (params.zcode) searchParams.set("zcode", params.zcode);
    if (params.zscode) searchParams.set("zscode", params.zscode);
    if (params.kind) searchParams.set("kind", params.kind);
    if (params.pageNo !== undefined) searchParams.set("pageNo", String(params.pageNo));
    if (params.numOfRows !== undefined) searchParams.set("numOfRows", String(params.numOfRows));
    return fetchEvApi<EvCharger>("getChargerInfo", searchParams);
  },

  // 충전기 상태 조회
  async chargerStatus(params: ChargerStatusParams = {}): Promise<ListResult<EvChargerStatus>> {
    const searchParams = getCommonParams();
    if (params.statId) searchParams.set("statId", params.statId);
    if (params.pageNo !== undefined) searchParams.set("pageNo", String(params.pageNo));
    if (params.numOfRows !== undefined) searchParams.set("numOfRows", String(params.numOfRows));
    return fetchEvApi<EvChargerStatus>("getChargerStatus", searchParams);
  },
};
