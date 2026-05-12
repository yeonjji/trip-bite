export type ShopCategoryGroup =
  | "mart"
  | "pharmacy"
  | "cafe"
  | "restaurant"
  | "convenience";

// 실제 소상공인 API 코드 체계 (B553077)
// indsLclsCd: I2=음식, G2=소매, Q1=보건의료, S2=수리·개인
// indsMclsCd: I212=비알코올, G204=종합소매, G215=의약·화장품
// indsSclsCd: G20404=슈퍼마켓, G20405=편의점, G21501=약국, I21201=카페
const MART_SCD = new Set(["G20404", "G20405"]); // 슈퍼마켓, 편의점
const PHARMACY_SCD = new Set(["G21501"]);         // 약국
const CAFE_MCD = new Set(["I212"]);               // 비알코올(카페·제과 포함)

export function resolveCategoryGroup(
  indsLclsCd: string,
  indsMclsCd: string,
  indsSclsCd: string,
): ShopCategoryGroup | null {
  if (MART_SCD.has(indsSclsCd)) return "mart";
  if (PHARMACY_SCD.has(indsSclsCd)) return "pharmacy";
  if (CAFE_MCD.has(indsMclsCd)) return "cafe";
  if (indsLclsCd === "I2") return "restaurant";
  if (indsLclsCd === "S2") return "convenience";
  return null;
}

export const SHOP_CATEGORY_LABELS: Record<ShopCategoryGroup, { ko: string; en: string }> = {
  mart:        { ko: "마트·편의점", en: "Mart" },
  pharmacy:    { ko: "약국",        en: "Pharmacy" },
  cafe:        { ko: "카페",        en: "Cafe" },
  restaurant:  { ko: "음식점",      en: "Restaurant" },
  convenience: { ko: "생활편의",    en: "Services" },
};

export const SHOP_CATEGORY_GROUPS: ShopCategoryGroup[] = [
  "mart", "pharmacy", "cafe", "restaurant", "convenience",
];
