// P2-05: sync-recipes Edge Function (Deno)
// COOKRCP01 API에서 레시피 전체 수집 후 recipes 테이블 upsert

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface CookRcpItem {
  RCP_SEQ: string;
  RCP_NM: string;
  RCP_WAY2: string;
  RCP_PAT2: string;
  INFO_ENG?: string;
  INFO_CAR?: string;
  INFO_PRO?: string;
  INFO_FAT?: string;
  INFO_NA?: string;
  HASH_TAG?: string;
  ATT_FILE_NO_MAIN?: string;
  ATT_FILE_NO_MK?: string;
  RCP_PARTS_DTLS?: string;
  MANUAL01?: string; MANUAL_IMG01?: string;
  MANUAL02?: string; MANUAL_IMG02?: string;
  MANUAL03?: string; MANUAL_IMG03?: string;
  MANUAL04?: string; MANUAL_IMG04?: string;
  MANUAL05?: string; MANUAL_IMG05?: string;
  MANUAL06?: string; MANUAL_IMG06?: string;
  MANUAL07?: string; MANUAL_IMG07?: string;
  MANUAL08?: string; MANUAL_IMG08?: string;
  MANUAL09?: string; MANUAL_IMG09?: string;
  MANUAL10?: string; MANUAL_IMG10?: string;
  MANUAL11?: string; MANUAL_IMG11?: string;
  MANUAL12?: string; MANUAL_IMG12?: string;
  MANUAL13?: string; MANUAL_IMG13?: string;
  MANUAL14?: string; MANUAL_IMG14?: string;
  MANUAL15?: string; MANUAL_IMG15?: string;
  MANUAL16?: string; MANUAL_IMG16?: string;
  MANUAL17?: string; MANUAL_IMG17?: string;
  MANUAL18?: string; MANUAL_IMG18?: string;
  MANUAL19?: string; MANUAL_IMG19?: string;
  MANUAL20?: string; MANUAL_IMG20?: string;
}

interface CookRcpApiResponse {
  COOKRCP01: {
    row: CookRcpItem[];
    total_count: string;
    RESULT: { CODE: string; MSG: string };
  };
}

interface RecipeStep {
  step: number;
  description: string;
  imageUrl?: string;
}

interface RecipeRow {
  rcp_seq: string;
  name: string;
  cooking_method: string;
  category: string;
  main_image_url: string | null;
  finished_image_url: string | null;
  ingredients: string | null;
  steps: RecipeStep[];
  nutrition: {
    calories?: number;
    carbs?: number;
    protein?: number;
    fat?: number;
    sodium?: number;
  };
  hash_tags: string[];
}

const PAGE_SIZE = 1000;

function parseNum(val?: string): number | undefined {
  if (!val || val.trim() === "") return undefined;
  const n = parseFloat(val);
  return isNaN(n) ? undefined : n;
}

function buildSteps(item: CookRcpItem): RecipeStep[] {
  const steps: RecipeStep[] = [];
  for (let i = 1; i <= 20; i++) {
    const pad = String(i).padStart(2, "0");
    const desc = item[`MANUAL${pad}` as keyof CookRcpItem] as string | undefined;
    const img = item[`MANUAL_IMG${pad}` as keyof CookRcpItem] as string | undefined;
    if (desc && desc.trim() !== "") {
      steps.push({
        step: i,
        description: desc.trim(),
        imageUrl: img && img.trim() !== "" ? img.trim() : undefined,
      });
    }
  }
  return steps;
}

function buildHashTags(hashTag?: string): string[] {
  if (!hashTag || hashTag.trim() === "") return [];
  return hashTag
    .split("#")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

function toRecipeRow(item: CookRcpItem): RecipeRow {
  return {
    rcp_seq: item.RCP_SEQ,
    name: item.RCP_NM,
    cooking_method: item.RCP_WAY2 ?? "",
    category: item.RCP_PAT2 ?? "",
    main_image_url: item.ATT_FILE_NO_MAIN?.trim() || null,
    finished_image_url: item.ATT_FILE_NO_MK?.trim() || null,
    ingredients: item.RCP_PARTS_DTLS?.trim() || null,
    steps: buildSteps(item),
    nutrition: {
      calories: parseNum(item.INFO_ENG),
      carbs: parseNum(item.INFO_CAR),
      protein: parseNum(item.INFO_PRO),
      fat: parseNum(item.INFO_FAT),
      sodium: parseNum(item.INFO_NA),
    },
    hash_tags: buildHashTags(item.HASH_TAG),
  };
}

async function fetchPage(
  baseUrl: string,
  startIdx: number,
  endIdx: number
): Promise<{ items: CookRcpItem[]; totalCount: number }> {
  const url = `${baseUrl}/${startIdx}/${endIdx}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`API 요청 실패: ${res.status} ${res.statusText}`);
  }

  const data: CookRcpApiResponse = await res.json();
  const { CODE, MSG } = data.COOKRCP01.RESULT;

  if (CODE !== "INFO-000") {
    throw new Error(`API 오류 [${CODE}]: ${MSG}`);
  }

  return {
    items: data.COOKRCP01.row ?? [],
    totalCount: parseInt(data.COOKRCP01.total_count, 10) || 0,
  };
}

serve(async (_req) => {
  const apiKey = Deno.env.get("RECIPE_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!apiKey || !supabaseUrl || !supabaseKey) {
    return new Response(
      JSON.stringify({ error: "필수 환경변수가 설정되지 않았습니다." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const baseUrl = `https://openapi.foodsafetykorea.go.kr/api/${apiKey}/COOKRCP01/json`;

  let totalCount = 0;
  let upsertedCount = 0;
  let pageStart = 1;

  try {
    // 첫 페이지 요청으로 전체 레시피 수 파악
    const firstPage = await fetchPage(baseUrl, pageStart, pageStart + PAGE_SIZE - 1);
    totalCount = firstPage.totalCount;

    const allItems: CookRcpItem[] = [...firstPage.items];
    pageStart += PAGE_SIZE;

    // 나머지 페이지 수집
    while (pageStart <= totalCount) {
      const endIdx = Math.min(pageStart + PAGE_SIZE - 1, totalCount);
      const page = await fetchPage(baseUrl, pageStart, endIdx);
      allItems.push(...page.items);
      pageStart += PAGE_SIZE;
    }

    // 1000개씩 배치 upsert
    const BATCH_SIZE = 1000;
    for (let i = 0; i < allItems.length; i += BATCH_SIZE) {
      const batch = allItems.slice(i, i + BATCH_SIZE).map(toRecipeRow);
      const { error } = await supabase
        .from("recipes")
        .upsert(batch, { onConflict: "rcp_seq" });

      if (error) {
        throw new Error(`upsert 오류: ${error.message}`);
      }
      upsertedCount += batch.length;
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalCount,
        upsertedCount,
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
