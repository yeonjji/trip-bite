export type ShopCategoryGroup =
  | "mart"              // G20404 슈퍼마켓
  | "convenience_store" // G20405 편의점
  | "pharmacy"          // G21501 약국
  | "cafe"              // I212 카페·음료
  | "restaurant"        // I2 음식점
  | "medical"           // Q1 보건업 (병원·치과·한의원)
  | "accommodation"     // I1 숙박업 (모텔·호텔·게스트하우스)
  | "entertainment"     // N1/N2 예술·스포츠·여가 (노래방·PC방·헬스장)
  | "convenience"       // S2 기타 생활서비스
  | "bank"              // K 금융보험업 (은행·신협·새마을금고)
  | "gas_station";      // G452 자동차연료 소매 (주유소)

// 소상공인 API 코드 체계 (B553077)
// indsLclsCd: I1=숙박, I2=음식, Q1=보건, N1/N2=여가·스포츠, G2=소매, S2=생활서비스, K=금융
// indsMclsCd: I212=비알코올음료, G204=종합소매, G215=의약·화장품, G452=자동차연료소매
// indsSclsCd: G20404=슈퍼마켓, G20405=편의점, G21501=약국

const MART_SCD = new Set(["G20404"]);              // 슈퍼마켓
const CONVENIENCE_STORE_SCD = new Set(["G20405"]); // 편의점
const PHARMACY_SCD = new Set(["G21501"]);           // 약국
const CAFE_MCD = new Set(["I212"]);                // 비알코올음료(카페·제과)
const GAS_STATION_MCD = new Set(["G452"]);         // 자동차연료 소매(주유소)

export function resolveCategoryGroup(
  indsLclsCd: string,
  indsMclsCd: string,
  indsSclsCd: string,
): ShopCategoryGroup | null {
  if (MART_SCD.has(indsSclsCd)) return "mart";
  if (CONVENIENCE_STORE_SCD.has(indsSclsCd)) return "convenience_store";
  if (PHARMACY_SCD.has(indsSclsCd)) return "pharmacy";
  if (CAFE_MCD.has(indsMclsCd)) return "cafe";
  if (GAS_STATION_MCD.has(indsMclsCd)) return "gas_station";
  if (indsLclsCd === "I1") return "accommodation";
  if (indsLclsCd === "I2") return "restaurant";
  if (indsLclsCd === "Q1") return "medical";
  if (indsLclsCd === "N1" || indsLclsCd === "N2") return "entertainment";
  if (indsLclsCd === "S2") return "convenience";
  if (indsLclsCd === "K") return "bank";
  return null;
}

export const ALL_SHOP_CATEGORIES: ShopCategoryGroup[] = [
  "mart", "convenience_store", "pharmacy", "cafe", "restaurant",
  "medical", "accommodation", "entertainment", "convenience",
  "bank", "gas_station",
];
