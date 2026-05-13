"use client";

import { useState, type ReactNode } from "react";
import {
  ShoppingCart, Pill, Coffee, Home, Mic2, Dumbbell,
  Cross, MapPin, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NearbyShop, NearbyShopsResult } from "@/lib/data/nearby-shops";
import type { ShopCategoryGroup } from "@/lib/constants/shop-categories";

// ─── 페이지 타입별 표시 그룹 설정 ──────────────────────────────────────────

export type ShopsPageType =
  | "travel"
  | "camping"
  | "festival"
  | "restaurant"
  | "market"
  | "facility";

type DisplayGroupId =
  | "essential"     // 편의점 + 마트 + 약국
  | "medical"       // 병원·치과·한의원
  | "accommodation" // 숙박
  | "entertainment" // 노래방·PC방·헬스장
  | "cafe";         // 카페

const PAGE_GROUPS: Record<ShopsPageType, DisplayGroupId[]> = {
  travel:     ["essential", "medical", "accommodation"],
  camping:    ["essential", "medical"],
  festival:   ["essential", "accommodation", "entertainment"],
  restaurant: ["cafe"],
  market:     ["essential", "accommodation"],
  facility:   ["cafe", "essential"],
};

// ─── 그룹 메타 정의 ─────────────────────────────────────────────────────────

type DisplayGroup = {
  id: DisplayGroupId;
  labelKo: string;
  labelEn: string;
  subtitleKo: string;
  subtitleEn: string;
  categories: ShopCategoryGroup[];
  iconEl: ReactNode;
  chipColor: string;
  cardBg: string;
  iconBg: string;
  iconColor: string;
};

const GROUPS: DisplayGroup[] = [
  {
    id: "essential",
    labelKo: "여행 필수품",
    labelEn: "Essentials",
    subtitleKo: "편의점·마트·약국",
    subtitleEn: "Convenience · Mart · Pharmacy",
    categories: ["convenience_store", "mart", "pharmacy"],
    iconEl: <ShoppingCart className="w-4 h-4" />,
    chipColor: "bg-amber-100 text-amber-800 border-amber-200",
    cardBg: "bg-amber-50",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-700",
  },
  {
    id: "medical",
    labelKo: "응급·의료",
    labelEn: "Medical",
    subtitleKo: "병원·치과·한의원",
    subtitleEn: "Hospital · Dental · Oriental",
    categories: ["medical"],
    iconEl: <Cross className="w-4 h-4" />,
    chipColor: "bg-rose-100 text-rose-700 border-rose-200",
    cardBg: "bg-rose-50",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
  },
  {
    id: "accommodation",
    labelKo: "주변 숙소",
    labelEn: "Stay",
    subtitleKo: "호텔·모텔·게스트하우스",
    subtitleEn: "Hotel · Motel · Guesthouse",
    categories: ["accommodation"],
    iconEl: <Home className="w-4 h-4" />,
    chipColor: "bg-sky-100 text-sky-700 border-sky-200",
    cardBg: "bg-sky-50",
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600",
  },
  {
    id: "entertainment",
    labelKo: "야간 시설",
    labelEn: "Nightlife",
    subtitleKo: "노래방·PC방·헬스장",
    subtitleEn: "Karaoke · PC Café · Gym",
    categories: ["entertainment"],
    iconEl: <Mic2 className="w-4 h-4" />,
    chipColor: "bg-violet-100 text-violet-700 border-violet-200",
    cardBg: "bg-violet-50",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
  },
  {
    id: "cafe",
    labelKo: "카페",
    labelEn: "Cafes",
    subtitleKo: "잠깐 쉬어가기 좋은 곳",
    subtitleEn: "A good place to rest",
    categories: ["cafe"],
    iconEl: <Coffee className="w-4 h-4" />,
    chipColor: "bg-orange-100 text-orange-700 border-orange-200",
    cardBg: "bg-orange-50",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-700",
  },
];

// ─── 자연어 설명 생성 ──────────────────────────────────────────────────────

function getShopDescription(shop: NearbyShop, isKo: boolean): string {
  const cat = shop.categoryGroup;
  const nm = shop.indsSclsNm?.toLowerCase() ?? "";

  if (!isKo) {
    const EN: Partial<Record<ShopCategoryGroup, string>> = {
      convenience_store: "Open late for your travel needs",
      mart: "Great for a quick grocery run",
      pharmacy: "Handy pharmacy for travel essentials",
      cafe: "A perfect spot to take a break",
      medical: "Nearby medical care",
      accommodation: "Comfortable stay nearby",
      entertainment: "Fun even after dark",
      restaurant: "Good eats nearby",
    };
    return EN[cat] ?? "Nearby";
  }

  if (cat === "convenience_store") return "늦게까지 운영하는 편의점";
  if (cat === "mart") return "간단히 장보기 좋은 마트";
  if (cat === "pharmacy") return "여행 중 들르기 좋은 약국";
  if (cat === "cafe") return "잠깐 쉬어가기 좋은 카페";
  if (cat === "accommodation") {
    if (nm.includes("호텔")) return "편하게 묵기 좋은 호텔";
    if (nm.includes("모텔")) return "가성비 좋은 모텔";
    if (nm.includes("게스트하우스") || nm.includes("호스텔")) return "여행자 게스트하우스";
    return "근처 숙박 시설";
  }
  if (cat === "medical") {
    if (nm.includes("치과")) return "가까운 치과";
    if (nm.includes("한의") || nm.includes("한방")) return "가까운 한의원";
    return "응급 시 방문하기 좋은 병원";
  }
  if (cat === "entertainment") {
    if (nm.includes("노래")) return "밤에도 즐길 수 있는 노래방";
    if (nm.includes("pc") || nm.includes("피씨")) return "게임할 수 있는 PC방";
    if (nm.includes("헬스") || nm.includes("피트니스") || nm.includes("gym")) return "가볍게 운동할 수 있는 헬스장";
    return "밤에도 즐길 수 있는 시설";
  }
  return "주변 시설";
}

function formatDist(m: number): string {
  if (m < 1000) return `${Math.round(m)}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

function getCategoryIcon(cat: ShopCategoryGroup, iconColor: string) {
  const cls = `w-5 h-5 ${iconColor}`;
  if (cat === "cafe") return <Coffee className={cls} />;
  if (cat === "pharmacy") return <Pill className={cls} />;
  if (cat === "medical") return <Cross className={cls} />;
  if (cat === "accommodation") return <Home className={cls} />;
  if (cat === "entertainment") return <Mic2 className={cls} />;
  if (cat === "convenience_store" || cat === "mart") return <ShoppingCart className={cls} />;
  return <Dumbbell className={cls} />;
}

// ─── 카드 컴포넌트 ──────────────────────────────────────────────────────────

function ShopCard({
  shop,
  group,
  isKo,
}: {
  shop: NearbyShop;
  group: DisplayGroup;
  isKo: boolean;
}) {
  const desc = getShopDescription(shop, isKo);
  const distLabel = formatDist(shop.distanceM);
  const name = shop.brchNm ? `${shop.bizesNm} ${shop.brchNm}` : shop.bizesNm;

  return (
    <div
      className={cn(
        "flex-shrink-0 w-44 rounded-2xl p-4 flex flex-col gap-2.5",
        group.cardBg,
        "border border-white/60"
      )}
    >
      {/* 아이콘 */}
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", group.iconBg)}>
        {getCategoryIcon(shop.categoryGroup, group.iconColor)}
      </div>

      {/* 이름 */}
      <div>
        <p className="text-[13px] font-bold text-[#1B1C1A] leading-snug line-clamp-1">
          {name}
        </p>
        {shop.indsSclsNm && (
          <p className="text-[10px] text-slate-400 mt-0.5">{shop.indsSclsNm}</p>
        )}
      </div>

      {/* 자연어 설명 */}
      <p className="text-[11px] leading-relaxed text-slate-500 flex-1 line-clamp-2">
        {desc}
      </p>

      {/* 거리 */}
      <div className="flex items-center gap-1 mt-auto">
        <MapPin className="w-3 h-3 text-slate-300 shrink-0" />
        <span className="text-[11px] font-medium text-slate-400">{distLabel}</span>
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ──────────────────────────────────────────────────────────

interface Props {
  shops: NearbyShopsResult;
  pageType: ShopsPageType;
  isKo: boolean;
}

export default function NearbyShopsSection({ shops, pageType, isKo }: Props) {
  const groupIds = PAGE_GROUPS[pageType];
  const visibleGroups = GROUPS.filter((g) => groupIds.includes(g.id));

  // 데이터 있는 그룹만 필터
  const activeGroups = visibleGroups.filter((g) =>
    g.categories.some((cat) => shops[cat]?.length > 0)
  );

  const [activeId, setActiveId] = useState<DisplayGroupId | null>(
    activeGroups[0]?.id ?? null
  );

  if (activeGroups.length === 0) return null;

  const currentGroup = activeGroups.find((g) => g.id === activeId) ?? activeGroups[0];

  const currentShops = currentGroup.categories
    .flatMap((cat) => shops[cat] ?? [])
    .sort((a, b) => a.distanceM - b.distanceM);

  return (
    <section className="mb-8">
      {/* 섹션 헤더 */}
      <div className="mb-4">
        <h2 className="font-headline text-xl font-bold text-[#1B1C1A]">
          {isKo ? "근처에서 함께 이용하기 좋은 곳" : "Useful Places Nearby"}
        </h2>
        <p className="mt-0.5 text-xs text-slate-400">
          {isKo
            ? "여행 중 유용하게 이용할 수 있는 주변 시설이에요"
            : "Helpful spots to use during your trip"}
        </p>
      </div>

      {/* 탭 칩 */}
      {activeGroups.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
          {activeGroups.map((g) => {
            const isActive = g.id === (activeId ?? activeGroups[0].id);
            return (
              <button
                key={g.id}
                onClick={() => setActiveId(g.id)}
                className={cn(
                  "flex-shrink-0 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                  isActive
                    ? g.chipColor + " shadow-sm"
                    : "bg-white border-gray-200 text-slate-500 hover:border-slate-300"
                )}
              >
                {g.iconEl}
                {isKo ? g.labelKo : g.labelEn}
              </button>
            );
          })}
        </div>
      )}

      {/* 그룹 서브타이틀 */}
      <p className="text-[11px] text-slate-400 mb-3">
        {isKo ? currentGroup.subtitleKo : currentGroup.subtitleEn}
        <span className="ml-1.5 text-slate-300">· {currentShops.length}곳</span>
      </p>

      {/* 카드 슬라이드 */}
      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-none -mx-4 px-4">
        {currentShops.map((shop) => (
          <ShopCard
            key={shop.id}
            shop={shop}
            group={currentGroup}
            isKo={isKo}
          />
        ))}
        {/* 말미 여백 */}
        <div className="flex-shrink-0 w-1" />
      </div>
    </section>
  );
}
