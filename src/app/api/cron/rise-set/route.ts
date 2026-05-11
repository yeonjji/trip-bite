import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 300;

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const BASE_URL = "https://apis.data.go.kr/B090041/openapi/service/RiseSetInfoService/getLCRiseSetInfo";
const API_KEY = process.env.PUBLIC_DATA_API_KEY!;

const AREAS = [
  { areaCode: "11", areaNm: "서울",   longitude: "126.9780", latitude: "37.5665" },
  { areaCode: "26", areaNm: "부산",   longitude: "129.0756", latitude: "35.1796" },
  { areaCode: "27", areaNm: "대구",   longitude: "128.6014", latitude: "35.8714" },
  { areaCode: "28", areaNm: "인천",   longitude: "126.7052", latitude: "37.4563" },
  { areaCode: "29", areaNm: "광주",   longitude: "126.8514", latitude: "35.1595" },
  { areaCode: "30", areaNm: "대전",   longitude: "127.3845", latitude: "36.3504" },
  { areaCode: "31", areaNm: "울산",   longitude: "129.3114", latitude: "35.5384" },
  { areaCode: "36", areaNm: "세종",   longitude: "127.2890", latitude: "36.4800" },
  { areaCode: "41", areaNm: "경기",   longitude: "127.0090", latitude: "37.4138" },
  { areaCode: "42", areaNm: "강원",   longitude: "127.7269", latitude: "37.8813" },
  { areaCode: "43", areaNm: "충북",   longitude: "127.4914", latitude: "36.6424" },
  { areaCode: "44", areaNm: "충남",   longitude: "127.1237", latitude: "36.5184" },
  { areaCode: "45", areaNm: "전북",   longitude: "127.1450", latitude: "35.8214" },
  { areaCode: "46", areaNm: "전남",   longitude: "126.4629", latitude: "34.8160" },
  { areaCode: "47", areaNm: "경북",   longitude: "128.6050", latitude: "36.0190" },
  { areaCode: "48", areaNm: "경남",   longitude: "128.6853", latitude: "35.2383" },
  { areaCode: "50", areaNm: "제주",   longitude: "126.5312", latitude: "33.4996" },
];

function toDateStr(ymd: string) {
  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
}

function nextNDays(n: number): string[] {
  const dates: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().slice(0, 10).replace(/-/g, ""));
  }
  return dates;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getClient();
  const dates = nextNDays(7);
  const rows: Record<string, unknown>[] = [];

  for (const area of AREAS) {
    for (const locdate of dates) {
      try {
        await new Promise((r) => setTimeout(r, 80));
        const params = new URLSearchParams({
          serviceKey: API_KEY,
          locdate,
          longitude: area.longitude,
          latitude: area.latitude,
          hubName: area.areaNm,
          _type: "json",
        });

        const res = await fetch(`${BASE_URL}?${params}`);
        if (!res.ok) continue;

        const data = await res.json();
        if (data?.response?.header?.resultCode !== "0000") continue;

        const item = data?.response?.body?.items?.item;
        if (!item) continue;

        rows.push({
          area_code:    area.areaCode,
          area_nm:      area.areaNm,
          locdate:      toDateStr(locdate),
          sunrise:      item.sunrise ?? null,
          sunset:       item.sunset  ?? null,
          moonrise:     item.moonrise ?? null,
          moonset:      item.moonset  ?? null,
          sun_altitude: item.sunAltitude ?? null,
          synced_at:    new Date().toISOString(),
        });
      } catch {
        // 개별 실패는 skip
      }
    }
  }

  if (rows.length > 0) {
    const { error } = await supabase
      .from("rise_set_info")
      .upsert(rows, { onConflict: "area_code,locdate" });
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, upserted: rows.length });
}
