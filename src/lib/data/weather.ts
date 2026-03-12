// P4-04: 3시간 캐시 기반 날씨 데이터

import { createClient } from "@/lib/supabase/server";
import { weatherApi } from "@/lib/api/weather-api";
import { GRID_COORDS } from "@/lib/constants/grid-coords";
import type { WeatherForecastItem } from "@/lib/api/weather-api";

const WEATHER_TTL_HOURS = 3;

interface WeatherCurrent {
  temp: string;
  sky: string;
  pty: string;
}

interface WeatherForecastDay {
  date: string;
  time: string;
  temp: string;
  sky: string;
}

interface WeatherData {
  current: WeatherCurrent | null;
  forecast: WeatherForecastDay[];
}

function parseForecasts(items: WeatherForecastItem[]): WeatherData {
  // 현재 시각 기준 가장 가까운 예보 추출
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const todayStr =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const currentHHmm = pad(now.getHours()) + pad(now.getMinutes());

  // 카테고리별 Map 구성: key = "fcstDate_fcstTime"
  const byDateTime: Record<string, Record<string, string>> = {};

  for (const item of items) {
    const key = `${item.fcstDate}_${item.fcstTime}`;
    if (!byDateTime[key]) byDateTime[key] = {};
    byDateTime[key][item.category] = item.fcstValue;
  }

  // 오늘 현재 시각 이후 첫 번째 슬롯을 current로 사용
  let current: WeatherCurrent | null = null;
  const forecastDays: WeatherForecastDay[] = [];

  const sortedKeys = Object.keys(byDateTime).sort();

  for (const key of sortedKeys) {
    const [date, time] = key.split("_");
    const slot = byDateTime[key];
    const hhmm = time.slice(0, 4);

    if (
      !current &&
      date === todayStr &&
      hhmm >= currentHHmm
    ) {
      current = {
        temp: slot["TMP"] ?? "--",
        sky: slot["SKY"] ?? "1",
        pty: slot["PTY"] ?? "0",
      };
    }

    // 3일치 예보 수집 (TMP + SKY 있는 슬롯)
    if (slot["TMP"] && slot["SKY"] && forecastDays.length < 24) {
      forecastDays.push({
        date,
        time: hhmm,
        temp: slot["TMP"],
        sky: slot["SKY"],
      });
    }
  }

  // current가 없으면 첫 번째 슬롯 사용
  if (!current && sortedKeys.length > 0) {
    const firstSlot = byDateTime[sortedKeys[0]];
    current = {
      temp: firstSlot["TMP"] ?? "--",
      sky: firstSlot["SKY"] ?? "1",
      pty: firstSlot["PTY"] ?? "0",
    };
  }

  return { current, forecast: forecastDays };
}

export async function getWeatherByAreaCode(
  areaCode: string
): Promise<WeatherData | null> {
  const coords = GRID_COORDS[areaCode];
  if (!coords) return null;

  const supabase = await createClient();

  // 캐시 조회
  const { data: cached, error } = await supabase
    .from("weather_cache")
    .select("*")
    .eq("area_code", areaCode)
    .single();

  const now = new Date();

  // 캐시 유효한 경우
  if (!error && cached && new Date(cached.expires_at) > now) {
    const items = cached.forecast_data as unknown as WeatherForecastItem[];
    return parseForecasts(items);
  }

  // 캐시 만료 또는 없음 → API 호출
  try {
    const items = await weatherApi.getForecast(coords.nx, coords.ny);

    const expiresAt = new Date(now.getTime() + WEATHER_TTL_HOURS * 60 * 60 * 1000);

    await supabase.from("weather_cache").upsert(
      {
        area_code: areaCode,
        nx: coords.nx,
        ny: coords.ny,
        forecast_data: items as unknown as Record<string, unknown>[],
        cached_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      },
      { onConflict: "area_code" }
    );

    return parseForecasts(items);
  } catch (err) {
    console.error("날씨 API 호출 실패:", err);

    // 만료된 캐시라도 반환
    if (cached) {
      const items = cached.forecast_data as unknown as WeatherForecastItem[];
      return parseForecasts(items);
    }

    return null;
  }
}
