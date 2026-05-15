import { createClient } from "@/lib/supabase/server";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { fetchShopsInRadius } from "@/lib/api/sdsc2-api";
import {
  resolveCategoryGroup,
  ALL_SHOP_CATEGORIES,
  type ShopCategoryGroup,
} from "@/lib/constants/shop-categories";
import { roundCoord, coordKey } from "@/lib/utils/cache-key";

export interface NearbyShop {
  id: number;
  bizesId: string;
  bizesNm: string;
  brchNm: string | null;
  indsLclsNm: string | null;
  indsMclsNm: string | null;
  indsSclsNm: string | null;
  categoryGroup: ShopCategoryGroup;
  rdnmAdr: string | null;
  lat: number;
  lng: number;
  distanceM: number;
}

export type NearbyShopsResult = Record<ShopCategoryGroup, NearbyShop[]>;

function getAnonClient() {
  return createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

const CACHE_TTL_DAYS = 30;

function emptyResult(): NearbyShopsResult {
  const result = {} as NearbyShopsResult;
  for (const cat of ALL_SHOP_CATEGORIES) {
    result[cat] = [];
  }
  return result;
}

function deduplicateBrands(shops: NearbyShop[]): NearbyShop[] {
  const countMap = new Map<string, number>();
  return shops.filter((s) => {
    const cnt = (countMap.get(s.bizesNm) ?? 0) + 1;
    countMap.set(s.bizesNm, cnt);
    return cnt <= 2;
  });
}

async function isCacheValid(
  supabase: Awaited<ReturnType<typeof createClient>>,
  lat: number,
  lng: number,
): Promise<boolean> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - CACHE_TTL_DAYS);

  const { count } = await supabase
    .from("nearby_shops")
    .select("id", { count: "exact", head: true })
    .gte("cached_at", cutoff.toISOString())
    .gte("lat", lat - 0.01)
    .lte("lat", lat + 0.01)
    .gte("lng", lng - 0.015)
    .lte("lng", lng + 0.015);

  return (count ?? 0) > 0;
}

async function fetchAndCache(
  supabase: Awaited<ReturnType<typeof createClient>>,
  lat: number,
  lng: number,
): Promise<void> {
  const shops = await fetchShopsInRadius(lng, lat, 1000);

  const records: Record<string, unknown>[] = [];
  const now = new Date().toISOString();

  for (const shop of shops) {
    const categoryGroup = resolveCategoryGroup(
      shop.indsLclsCd,
      shop.indsMclsCd,
      shop.indsSclsCd,
    );
    if (!categoryGroup) continue;

    const shopLat = parseFloat(shop.lat);
    const shopLng = parseFloat(shop.lon);
    if (isNaN(shopLat) || isNaN(shopLng)) continue;

    records.push({
      bizes_id:       shop.bizesId,
      bizes_nm:       shop.bizesNm,
      brch_nm:        shop.brchNm || null,
      inds_lcls_cd:   shop.indsLclsCd,
      inds_lcls_nm:   shop.indsLclsNm,
      inds_mcls_cd:   shop.indsMclsCd,
      inds_mcls_nm:   shop.indsMclsNm,
      inds_scls_cd:   shop.indsSclsCd,
      inds_scls_nm:   shop.indsSclsNm,
      category_group: categoryGroup,
      rdnm_adr:       shop.rdnmAdr || null,
      lno_adr:        shop.lnoAdr || null,
      lat:            shopLat,
      lng:            shopLng,
      cached_at:      now,
    });
  }

  if (records.length === 0) return;

  await supabase
    .from("nearby_shops")
    .upsert(records, { onConflict: "bizes_id" });
}

function mapRpcRow(row: Record<string, unknown>): NearbyShop {
  return {
    id:            row.id as number,
    bizesId:       row.bizes_id as string,
    bizesNm:       row.bizes_nm as string,
    brchNm:        (row.brch_nm as string) || null,
    indsLclsNm:    (row.inds_lcls_nm as string) || null,
    indsMclsNm:    (row.inds_mcls_nm as string) || null,
    indsSclsNm:    (row.inds_scls_nm as string) || null,
    categoryGroup: row.category_group as ShopCategoryGroup,
    rdnmAdr:       (row.rdnm_adr as string) || null,
    lat:           Number(row.lat),
    lng:           Number(row.lng),
    distanceM:     row.distance_m as number,
  };
}

export async function getNearbyShops(
  lat: number,
  lng: number,
  radiusMeters = 1000,
  limitPerCategory = 5,
): Promise<NearbyShopsResult> {
  const supabase = await createClient();

  const valid = await isCacheValid(supabase, lat, lng);

  if (!valid) {
    try {
      await fetchAndCache(supabase, lat, lng);
    } catch (err) {
      console.error("[NearbyShops] API fetch 실패:", err);
      return emptyResult();
    }
  }

  const rpcResults = await Promise.allSettled(
    ALL_SHOP_CATEGORIES.map((cat) =>
      supabase.rpc("get_nearby_shops", {
        p_lat:         lat,
        p_lng:         lng,
        radius_meters: radiusMeters,
        result_limit:  limitPerCategory * 3,
        p_category:    cat,
      }),
    ),
  );

  const result = emptyResult();

  for (let i = 0; i < ALL_SHOP_CATEGORIES.length; i++) {
    const cat = ALL_SHOP_CATEGORIES[i];
    const rpc = rpcResults[i];
    if (rpc.status !== "fulfilled" || rpc.value.error) continue;

    const rows = (rpc.value.data ?? []) as Record<string, unknown>[];
    result[cat] = deduplicateBrands(rows.map(mapRpcRow)).slice(0, limitPerCategory);
  }

  const totalCount = Object.values(result).reduce((s, arr) => s + arr.length, 0);
  if (totalCount < 3 && radiusMeters < 2000) {
    return getNearbyShops(lat, lng, 2000, limitPerCategory);
  }

  return result;
}

// 캐시된 버전 — 상세 페이지 Suspense 내부 전용.
// upsert 경로를 의도적으로 생략하고 RPC만 호출. cold cache에서는 빈 결과 가능.
// 일반 getNearbyShops가 운영 중에 DB를 채우면 1시간 단위로 자연스럽게 정상화됨.
export function getNearbyShopsCached(
  lat: number,
  lng: number,
  radiusMeters = 1000,
  limitPerCategory = 5,
) {
  const rLat = roundCoord(lat);
  const rLng = roundCoord(lng);
  return unstable_cache(
    async (): Promise<NearbyShopsResult> => {
      const supabase = getAnonClient();
      const rpcResults = await Promise.allSettled(
        ALL_SHOP_CATEGORIES.map((cat) =>
          supabase.rpc("get_nearby_shops", {
            p_lat:         rLat,
            p_lng:         rLng,
            radius_meters: radiusMeters,
            result_limit:  limitPerCategory * 3,
            p_category:    cat,
          }),
        ),
      );

      const result = emptyResult();
      for (let i = 0; i < ALL_SHOP_CATEGORIES.length; i++) {
        const cat = ALL_SHOP_CATEGORIES[i];
        const rpc = rpcResults[i];
        if (rpc.status !== "fulfilled" || rpc.value.error) continue;
        const rows = (rpc.value.data ?? []) as Record<string, unknown>[];
        result[cat] = deduplicateBrands(rows.map(mapRpcRow)).slice(0, limitPerCategory);
      }
      return result;
    },
    ["nearby-shops", coordKey(rLat, rLng), String(radiusMeters), String(limitPerCategory)],
    { revalidate: 3600, tags: ["nearby-shops"] },
  )();
}
