import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 300;

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const BASE_URL = "https://apis.data.go.kr/B551011/DataLabService";
const API_KEY = process.env.PUBLIC_DATA_API_KEY!;

function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

async function fetchAll(endpoint: string, startYmd: string, endYmd: string) {
  const items: Record<string, unknown>[] = [];
  let pageNo = 1;
  const numOfRows = 100;

  while (true) {
    const params = new URLSearchParams({
      serviceKey: API_KEY,
      MobileOS: "ETC",
      MobileApp: "TripBite",
      _type: "json",
      numOfRows: String(numOfRows),
      pageNo: String(pageNo),
      startYmd,
      endYmd,
    });

    const res = await fetch(`${BASE_URL}/${endpoint}?${params}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const header = data?.response?.header;
    if (header?.resultCode !== "0000") throw new Error(`API 오류: ${header?.resultMsg}`);

    const body = data?.response?.body;
    const raw = body?.items;
    const page: Record<string, unknown>[] =
      !raw || raw === "" ? [] : Array.isArray(raw.item) ? raw.item : [raw.item];

    items.push(...page);
    if (items.length >= (body?.totalCount ?? 0) || page.length < numOfRows) break;
    pageNo++;
    await new Promise((r) => setTimeout(r, 200));
  }

  return items;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ymd = yesterday();
  const supabase = getClient();

  try {
    const metroItems = await fetchAll("metcoRegnVisitrDDList", ymd, ymd);
    if (metroItems.length > 0) {
      const metroRows = metroItems.map((item) => ({
        area_code:    String(item.areaCode),
        area_nm:      item.areaNm,
        base_ymd:     `${String(item.baseYmd).slice(0, 4)}-${String(item.baseYmd).slice(4, 6)}-${String(item.baseYmd).slice(6, 8)}`,
        daywk_div_cd: String(item.daywkDivCd),
        daywk_div_nm: item.daywkDivNm,
        tou_div_cd:   String(item.touDivCd),
        tou_div_nm:   item.touDivNm,
        tou_num:      item.touNum,
        synced_at:    new Date().toISOString(),
      }));
      const { error } = await supabase
        .from("visitor_stats_metro")
        .upsert(metroRows, { onConflict: "area_code,base_ymd,tou_div_cd" });
      if (error) throw error;
    }

    const localItems = await fetchAll("locgoRegnVisitrDDList", ymd, ymd);
    if (localItems.length > 0) {
      const localRows = localItems.map((item) => ({
        signgu_code:  String(item.signguCode),
        signgu_nm:    item.signguNm,
        base_ymd:     `${String(item.baseYmd).slice(0, 4)}-${String(item.baseYmd).slice(4, 6)}-${String(item.baseYmd).slice(6, 8)}`,
        daywk_div_cd: String(item.daywkDivCd),
        daywk_div_nm: item.daywkDivNm,
        tou_div_cd:   String(item.touDivCd),
        tou_div_nm:   item.touDivNm,
        tou_num:      item.touNum,
        synced_at:    new Date().toISOString(),
      }));
      const { error } = await supabase
        .from("visitor_stats_local")
        .upsert(localRows, { onConflict: "signgu_code,base_ymd,tou_div_cd" });
      if (error) throw error;
    }

    return NextResponse.json({
      ok: true,
      date: ymd,
      metro: metroItems.length,
      local: localItems.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
