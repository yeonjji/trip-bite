// 소상공인시장진흥공단 상가(상권)정보 API (B553077)

const BASE_URL = "https://apis.data.go.kr/B553077/api/open/sdsc2";

export interface Sdsc2Shop {
  bizesId: string;
  bizesNm: string;
  brchNm: string;
  indsLclsCd: string;
  indsLclsNm: string;
  indsMclsCd: string;
  indsMclsNm: string;
  indsSclsCd: string;
  indsSclsNm: string;
  rdnmAdr: string;
  lnoAdr: string;
  lon: string;
  lat: string;
}

function getServiceKey(): string {
  const key = process.env.PUBLIC_DATA_API_KEY?.trim();
  if (!key) throw new Error("PUBLIC_DATA_API_KEY 환경변수가 설정되지 않았습니다.");
  return key;
}

// indsLclsCd 필터 없이 전체 조회 — 코드 분류는 호출 측에서 처리
export async function fetchShopsInRadius(
  cx: number,
  cy: number,
  radius: number,
  numOfRows = 1000,
  pageNo = 1,
): Promise<Sdsc2Shop[]> {
  const params = new URLSearchParams();
  params.set("serviceKey", getServiceKey());
  params.set("cx", String(cx));
  params.set("cy", String(cy));
  params.set("radius", String(Math.min(radius, 1000)));
  params.set("numOfRows", String(numOfRows));
  params.set("pageNo", String(pageNo));
  params.set("type", "json");

  const url = `${BASE_URL}/storeListInRadius?${params.toString()}`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`SDSC2 API 요청 실패: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const header = data?.header;
  if (header?.resultCode !== "00") return [];

  const items = data?.body?.items;
  if (!items || items === "") return [];
  return Array.isArray(items) ? items : [items];
}
