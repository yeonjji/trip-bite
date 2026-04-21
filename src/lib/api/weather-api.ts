// P4-03: 기상청 단기예보 API 클라이언트

const BASE_URL =
  "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst";

// 발표시각 목록 (HHmm 형식)
const BASE_TIMES = ["0200", "0500", "0800", "1100", "1400", "1700", "2000", "2300"];

export interface WeatherForecastItem {
  baseDate: string;
  baseTime: string;
  category: string;
  fcstDate: string;
  fcstTime: string;
  fcstValue: string;
  nx: number;
  ny: number;
}

interface WeatherApiResponse {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      items: {
        item: WeatherForecastItem[];
      };
      numOfRows: number;
      pageNo: number;
      totalCount: number;
    };
  };
}

function getLatestBaseTime(now: Date): { baseDate: string; baseTime: string } {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hour = now.getHours();
  const minute = now.getMinutes();

  const currentHHmm = pad(hour) + pad(minute);

  // 현재 시각보다 이전인 가장 최근 발표시각 탐색 (1시간 여유)
  let baseTime = BASE_TIMES[0];
  let baseDate = `${year}${month}${day}`;

  for (let i = BASE_TIMES.length - 1; i >= 0; i--) {
    const t = BASE_TIMES[i];
    // 발표 후 10분 뒤부터 데이터 제공됨을 고려해 +10분 여유
    const tHour = parseInt(t.slice(0, 2), 10);
    const tMinute = parseInt(t.slice(2, 4), 10);
    const releaseHHmm =
      pad(tHour) + pad(tMinute + 10 > 59 ? tMinute - 50 : tMinute + 10);

    if (currentHHmm >= releaseHHmm) {
      baseTime = t;
      break;
    }
  }

  // 현재시각이 0210 이전이면 전날 2300 사용
  if (currentHHmm < "0210") {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yYear = yesterday.getFullYear();
    const yMonth = pad(yesterday.getMonth() + 1);
    const yDay = pad(yesterday.getDate());
    baseDate = `${yYear}${yMonth}${yDay}`;
    baseTime = "2300";
  }

  return { baseDate, baseTime };
}

export const weatherApi = {
  async getForecast(nx: number, ny: number): Promise<WeatherForecastItem[]> {
    const key = process.env.PUBLIC_DATA_API_KEY;
    if (!key) throw new Error("PUBLIC_DATA_API_KEY 환경변수가 설정되지 않았습니다.");

    const now = new Date();
    const { baseDate, baseTime } = getLatestBaseTime(now);

    const params = new URLSearchParams();
    params.set("serviceKey", key);
    params.set("numOfRows", "290");
    params.set("pageNo", "1");
    params.set("dataType", "JSON");
    params.set("base_date", baseDate);
    params.set("base_time", baseTime);
    params.set("nx", String(nx));
    params.set("ny", String(ny));

    const url = `${BASE_URL}?${params.toString()}`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      throw new Error(`기상청 API 요청 실패: ${res.status} ${res.statusText}`);
    }

    const data: WeatherApiResponse = await res.json();
    const { resultCode, resultMsg } = data.response.header;

    if (resultCode !== "00") {
      throw new Error(`기상청 API 오류 [${resultCode}]: ${resultMsg}`);
    }

    return data.response.body.items.item;
  },
};
