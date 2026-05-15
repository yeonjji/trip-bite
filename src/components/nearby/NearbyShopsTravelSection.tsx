"use client";

import { useState, useEffect, type ReactNode } from "react";
import {
  ShoppingCart, Pill, Cross, Building2, Fuel,
  MapPin, Navigation, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NearbyShop, NearbyShopsResult } from "@/lib/data/nearby-shops";
import type { ShopCategoryGroup } from "@/lib/constants/shop-categories";

// ─── 카테고리 정의 ──────────────────────────────────────────────────────────

type TravelCategoryId = "all" | "mart" | "pharmacy" | "medical" | "bank" | "gas_station";

type TravelCategory = {
  id: TravelCategoryId;
  labelKo: string;
  labelEn: string;
  groups: ShopCategoryGroup[];
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  badgeColor: string;
};

const TRAVEL_CATEGORIES: TravelCategory[] = [
  {
    id: "all",
    labelKo: "전체",
    labelEn: "All",
    groups: ["mart", "convenience_store", "pharmacy", "medical", "bank", "gas_station"],
    icon: <MapPin className="w-4 h-4" />,
    iconBg: "bg-stone-100",
    iconColor: "text-stone-600",
    badgeColor: "bg-stone-100 text-stone-700",
  },
  {
    id: "mart",
    labelKo: "마트/편의점",
    labelEn: "Mart",
    groups: ["mart", "convenience_store"],
    icon: <ShoppingCart className="w-4 h-4" />,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-700",
    badgeColor: "bg-amber-100 text-amber-800",
  },
  {
    id: "pharmacy",
    labelKo: "약국",
    labelEn: "Pharmacy",
    groups: ["pharmacy"],
    icon: <Pill className="w-4 h-4" />,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-700",
    badgeColor: "bg-emerald-100 text-emerald-800",
  },
  {
    id: "medical",
    labelKo: "병원",
    labelEn: "Hospital",
    groups: ["medical"],
    icon: <Cross className="w-4 h-4" />,
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    badgeColor: "bg-rose-100 text-rose-700",
  },
  {
    id: "bank",
    labelKo: "은행",
    labelEn: "Bank",
    groups: ["bank"],
    icon: <Building2 className="w-4 h-4" />,
    iconBg: "bg-sky-100",
    iconColor: "text-sky-700",
    badgeColor: "bg-sky-100 text-sky-800",
  },
  {
    id: "gas_station",
    labelKo: "주유소",
    labelEn: "Gas Station",
    groups: ["gas_station"],
    icon: <Fuel className="w-4 h-4" />,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-700",
    badgeColor: "bg-violet-100 text-violet-800",
  },
];

const DEFAULT_VISIBLE = 3;

// ─── 유틸 ────────────────────────────────────────────────────────────────────

function formatDist(m: number): string {
  if (m < 1000) return `${Math.round(m)}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

function getCategoryLabel(cat: ShopCategoryGroup, isKo: boolean): string {
  const map: Partial<Record<ShopCategoryGroup, [string, string]>> = {
    mart:             ["마트",    "Mart"],
    convenience_store:["편의점",  "Conv. Store"],
    pharmacy:         ["약국",    "Pharmacy"],
    medical:          ["병원",    "Hospital"],
    bank:             ["은행",    "Bank"],
    gas_station:      ["주유소",  "Gas Station"],
  };
  const pair = map[cat];
  if (!pair) return cat;
  return isKo ? pair[0] : pair[1];
}

function getNaverMapUrl(shop: NearbyShop): string {
  const q = encodeURIComponent(shop.brchNm ? `${shop.bizesNm} ${shop.brchNm}` : shop.bizesNm);
  return `https://map.naver.com/p/search/${q}?c=${shop.lng},${shop.lat},15,0,0,0,dh`;
}

// ─── 카드 ────────────────────────────────────────────────────────────────────

function ShopCard({
  shop,
  category,
  isKo,
}: {
  shop: NearbyShop;
  category: TravelCategory;
  isKo: boolean;
}) {
  const name = shop.brchNm ? `${shop.bizesNm} ${shop.brchNm}` : shop.bizesNm;
  const catLabel = getCategoryLabel(shop.categoryGroup, isKo);
  const address = shop.rdnmAdr ?? null;

  return (
    <div className="bg-white rounded-2xl border border-[#EDE8DF] p-4 flex flex-col gap-3 hover:shadow-md hover:border-[#C8A882] transition-all">
      {/* 아이콘 + 카테고리 뱃지 */}
      <div className="flex items-start justify-between gap-2">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", category.iconBg)}>
          <span className={category.iconColor}>{category.icon}</span>
        </div>
        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 mt-1", category.badgeColor)}>
          {catLabel}
        </span>
      </div>

      {/* 시설명 */}
      <div>
        <p className="text-sm font-bold text-[#1B1C1A] leading-snug line-clamp-2">{name}</p>
      </div>

      {/* 주소 */}
      {address && (
        <p className="text-[11px] text-[#7A6A60] leading-relaxed line-clamp-2 flex items-start gap-1">
          <MapPin className="w-3 h-3 shrink-0 mt-0.5 text-[#B5A090]" />
          {address}
        </p>
      )}

      {/* 거리 + 길찾기 */}
      <div className="flex items-center justify-between mt-auto pt-1 border-t border-[#F0EBE3]">
        <span className="text-xs font-bold text-[#A07850]">
          {formatDist(shop.distanceM)}
        </span>
        <a
          href={getNaverMapUrl(shop)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5A413A] hover:text-[#D84315] transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <Navigation className="w-3 h-3" />
          {isKo ? "지도에서 보기" : "View on Map"}
        </a>
      </div>
    </div>
  );
}

// ─── 메인 ────────────────────────────────────────────────────────────────────

interface Props {
  shops: NearbyShopsResult;
  isKo: boolean;
}

export default function NearbyShopsTravelSection({ shops, isKo }: Props) {
  // 데이터가 있는 탭만 표시 (전체는 항상 포함)
  const activeCategories = TRAVEL_CATEGORIES.filter((cat) => {
    if (cat.id === "all") return true;
    return cat.groups.some((g) => (shops[g]?.length ?? 0) > 0);
  });

  // 전체에 데이터가 없으면 섹션 숨김
  const totalCount = activeCategories
    .filter((c) => c.id !== "all")
    .reduce((sum, c) => sum + c.groups.reduce((s, g) => s + (shops[g]?.length ?? 0), 0), 0);

  const [activeId, setActiveId] = useState<TravelCategoryId>(() => {
    // 마트/편의점에 데이터 있으면 기본 선택, 없으면 첫 번째 데이터 있는 탭
    const hasMart = (shops.mart?.length ?? 0) + (shops.convenience_store?.length ?? 0) > 0;
    if (hasMart) return "mart";
    const first = activeCategories.find((c) => c.id !== "all");
    return first?.id ?? "all";
  });

  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (totalCount === 0) {
      console.log("[주변 편의시설] 정보가 없습니다 (마트/편의점:0 / 약국:0 / 병원:0 / 은행:0 / 주유소:0)");
    } else {
      const mart = (shops.mart?.length ?? 0) + (shops.convenience_store?.length ?? 0);
      const pharmacy = shops.pharmacy?.length ?? 0;
      const medical = shops.medical?.length ?? 0;
      const bank = shops.bank?.length ?? 0;
      const gas = shops.gas_station?.length ?? 0;
      console.log(
        `[주변 편의시설] 정보가 있습니다 — 마트/편의점:${mart} / 약국:${pharmacy} / 병원:${medical} / 은행:${bank} / 주유소:${gas}`
      );
    }
  }, [totalCount, shops]);

  if (totalCount === 0) return null;

  const currentCat = activeCategories.find((c) => c.id === activeId) ?? activeCategories[0];

  const currentShops: NearbyShop[] = currentCat.id === "all"
    ? currentCat.groups
        .flatMap((g) => shops[g] ?? [])
        .sort((a, b) => a.distanceM - b.distanceM)
    : currentCat.groups
        .flatMap((g) => shops[g] ?? [])
        .sort((a, b) => a.distanceM - b.distanceM);

  const visibleShops = expanded ? currentShops : currentShops.slice(0, DEFAULT_VISIBLE);
  const hasMore = currentShops.length > DEFAULT_VISIBLE;

  // 현재 탭의 카테고리 객체 (카드 스타일링용)
  function getCatForShop(shop: NearbyShop): TravelCategory {
    return (
      TRAVEL_CATEGORIES.find((c) => c.groups.includes(shop.categoryGroup)) ??
      TRAVEL_CATEGORIES[0]
    );
  }

  return (
    <section className="py-8">
      {/* 섹션 헤더 */}
      <div className="mb-5">
        <h2 className="font-headline text-xl font-bold text-[#1B1C1A]">
          {isKo ? "여행 중 필요한 주변 편의시설" : "Nearby Essentials for Your Trip"}
        </h2>
        <p className="mt-1 text-xs text-[#8A7A70] leading-relaxed">
          {isKo
            ? "마트, 약국, 병원, 은행, 주유소 등 여행 중 필요할 수 있는 시설을 가까운 순으로 정리했어요."
            : "Marts, pharmacies, hospitals, banks, and gas stations — sorted by distance."}
        </p>
      </div>

      {/* 탭 pill 메뉴 */}
      <div className="flex gap-2 flex-wrap mb-6">
        {activeCategories.map((cat) => {
          const isActive = cat.id === activeId;
          const catShopCount = cat.id === "all"
            ? totalCount
            : cat.groups.reduce((s, g) => s + (shops[g]?.length ?? 0), 0);

          return (
            <button
              key={cat.id}
              onClick={() => {
                setActiveId(cat.id);
                setExpanded(false);
              }}
              className={cn(
                "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all",
                isActive
                  ? "bg-[#6B3E26] text-white shadow-sm"
                  : "bg-[#F5F0E8] text-[#5A413A] hover:bg-[#EDE4D5] hover:text-[#6B3E26]"
              )}
            >
              {cat.icon}
              {isKo ? cat.labelKo : cat.labelEn}
              {catShopCount > 0 && (
                <span className={cn(
                  "inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold",
                  isActive ? "bg-white/25 text-white" : "bg-[#DDD5C6] text-[#5A413A]"
                )}>
                  {catShopCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 카드 그리드 */}
      {visibleShops.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visibleShops.map((shop) => (
              <ShopCard
                key={shop.id}
                shop={shop}
                category={currentCat.id === "all" ? getCatForShop(shop) : currentCat}
                isKo={isKo}
              />
            ))}
          </div>

          {/* 더보기 버튼 */}
          {hasMore && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setExpanded((v) => !v)}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full border border-[#C8A882] text-sm font-semibold text-[#6B3E26] bg-white hover:bg-[#F5F0E8] transition-colors"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    {isKo ? "접기" : "Show less"}
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    {isKo
                      ? `더보기 (+${currentShops.length - DEFAULT_VISIBLE}곳)`
                      : `Show more (+${currentShops.length - DEFAULT_VISIBLE})`}
                  </>
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="py-8 text-center text-sm text-[#8A7A70] bg-[#F9F6F1] rounded-2xl">
          {isKo
            ? "주변에 확인된 시설이 없어요."
            : "No nearby facilities found."}
        </div>
      )}

      {/* 안내 문구 */}
      <p className="mt-4 text-[11px] text-[#B5A090] text-center">
        {isKo
          ? "소상공인시장진흥공단 상권정보를 기반으로 제공됩니다."
          : "Data provided by Korea's Small Enterprise and Market Service."}
      </p>
    </section>
  );
}
