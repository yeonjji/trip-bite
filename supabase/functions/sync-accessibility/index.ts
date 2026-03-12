// P3-04: sync-accessibility Edge Function (Deno)
// TourAPI detailPetTour 호출 → accessibility_info upsert

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface TourPetInfo {
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

interface TourApiResponse {
  response: {
    header: { resultCode: string; resultMsg: string };
    body: {
      items: { item: TourPetInfo[] } | "";
      numOfRows: number;
      pageNo: number;
      totalCount: number;
    };
  };
}

interface DestinationRow {
  id: string;
  content_id: string;
}

const BATCH_SIZE = 10;

async function fetchPetTour(
  baseUrl: string,
  apiKey: string,
  contentId: string
): Promise<TourPetInfo | null> {
  const params = new URLSearchParams({
    serviceKey: apiKey,
    MobileOS: "ETC",
    MobileApp: "TripBite",
    _type: "json",
    contentId,
  });
  const url = `${baseUrl}/detailPetTour1?${params.toString()}`;
  const res = await fetch(url);

  if (!res.ok) return null;

  const data: TourApiResponse = await res.json();
  const { resultCode } = data.response.header;
  if (resultCode !== "0000") return null;

  const items = data.response.body.items;
  if (items === "" || items.item.length === 0) return null;

  return items.item[0];
}

serve(async (_req) => {
  const tourApiKey = Deno.env.get("TOUR_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!tourApiKey || !supabaseUrl || !supabaseKey) {
    return new Response(
      JSON.stringify({ error: "필수 환경변수가 설정되지 않았습니다." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const tourBaseUrl = "https://apis.data.go.kr/B551011/KorService1";

  // destinations 테이블에서 content_id 목록 조회
  const { data: destinations, error: destError } = await supabase
    .from("destinations")
    .select("id, content_id");

  if (destError) {
    return new Response(
      JSON.stringify({ error: `destinations 조회 실패: ${destError.message}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const rows = (destinations as DestinationRow[]) ?? [];
  let upsertedCount = 0;
  let errorCount = 0;

  try {
    // BATCH_SIZE씩 순차 처리
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (dest) => {
          try {
            const petInfo = await fetchPetTour(tourBaseUrl, tourApiKey, dest.content_id);

            const petPossible =
              petInfo?.acmpanypetpossible === "1" ||
              petInfo?.acmpanypetpossible === "Y" ||
              petInfo?.acmpanypetpossible === "가능"
                ? true
                : petInfo
                ? false
                : null;

            const record = {
              destination_id: dest.id,
              pet_possible: petPossible,
              pet_size_range: petInfo?.acmpanypetsizerange ?? null,
              pet_fee: petInfo?.relaacmpanypetfee ?? null,
              pet_count: petInfo?.acmpanypetcount ?? null,
              pet_info: petInfo?.petinfo ?? null,
              wheelchair: null,
              foreign_friendly: null,
              raw_data: petInfo ? (petInfo as unknown as Record<string, unknown>) : null,
              cached_at: new Date().toISOString(),
            };

            const { error } = await supabase
              .from("accessibility_info")
              .upsert(record, { onConflict: "destination_id" });

            if (error) {
              console.error(`upsert 오류 (${dest.content_id}): ${error.message}`);
              errorCount++;
            } else {
              upsertedCount++;
            }
          } catch (err) {
            console.error(`처리 오류 (${dest.content_id}):`, err);
            errorCount++;
          }
        })
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: rows.length,
        upsertedCount,
        errorCount,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
