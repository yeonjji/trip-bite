"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import type {
  NearbyTourItem,
  NearbyTourRecommendations,
  NearbyTourType,
} from "@/lib/data/nearby-tour-recommendations";
import { NEARBY_TOUR_PLACEHOLDER_IMAGE } from "@/lib/data/nearby-tour-recommendations";

type FacilityNearbyType = NearbyTourType | "restaurant" | "cafe";

const TYPE_LABELS: Record<FacilityNearbyType, string> = {
  travel: "여행지",
  festival: "축제",
  accommodation: "숙소",
  restaurant: "맛집",
  cafe: "카페",
};

const TYPE_BADGE: Record<FacilityNearbyType, string> = {
  travel: "bg-sky-100 text-sky-700",
  festival: "bg-violet-100 text-violet-700",
  accommodation: "bg-emerald-100 text-emerald-700",
  restaurant: "bg-orange-100 text-orange-700",
  cafe: "bg-amber-100 text-amber-700",
};

function buildNaverSearchUrl(item: NearbyTourItem) {
  const query = item.address ? `${item.title} ${item.address}` : item.title;
  return `https://map.naver.com/v5/search/${encodeURIComponent(query)}?c=${item.lng},${item.lat},15,0,0,0,dh`;
}

function getHref(
  item: NearbyTourItem,
  type: FacilityNearbyType,
  locale: string
): { href: string; external: boolean } {
  if (type === "travel") return { href: `/${locale}/travel/${item.contentId}`, external: false };
  if (type === "festival") return { href: `/${locale}/events/${item.contentId}`, external: false };
  if (type === "restaurant" || type === "cafe")
    return { href: `/${locale}/restaurants/${item.contentId}`, external: false };
  return { href: buildNaverSearchUrl(item), external: true };
}

function CompactCard({
  item,
  type,
  locale,
}: {
  item: NearbyTourItem;
  type: FacilityNearbyType;
  locale: string;
}) {
  const [imgSrc, setImgSrc] = useState(item.image || NEARBY_TOUR_PLACEHOLDER_IMAGE);
  const isPlaceholder = imgSrc === NEARBY_TOUR_PLACEHOLDER_IMAGE;
  const { href, external } = getHref(item, type, locale);

  const inner = (
    <article className="group overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className="relative aspect-[3/2] overflow-hidden bg-[#F4F1E9]">
        <Image
          src={imgSrc}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          unoptimized
          className={
            isPlaceholder
              ? "object-contain p-4 opacity-40"
              : "object-cover transition-transform duration-300 group-hover:scale-105"
          }
          onError={() => setImgSrc(NEARBY_TOUR_PLACEHOLDER_IMAGE)}
        />
        <span
          className={`absolute left-2 top-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold shadow-sm ${TYPE_BADGE[type]}`}
        >
          {TYPE_LABELS[type]}
        </span>
      </div>
      <div className="p-2.5">
        <h3 className="line-clamp-1 text-sm font-semibold text-[#1B1C1A] leading-snug mb-0.5">
          {item.title}
        </h3>
        <span className="text-[11px] text-gray-400">{item.distance}km</span>
      </div>
    </article>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }
  return <Link href={href}>{inner}</Link>;
}

function CompactSection({
  emoji,
  title,
  items,
  type,
  locale,
}: {
  emoji: string;
  title: string;
  items: NearbyTourItem[];
  type: FacilityNearbyType;
  locale: string;
}) {
  if (items.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base leading-none">{emoji}</span>
        <h2 className="text-base font-bold text-[#1B1C1A]">{title}</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((item) => (
          <CompactCard key={item.id} item={item} type={type} locale={locale} />
        ))}
      </div>
    </div>
  );
}

const TOUR_TAB_LABELS: Partial<Record<NearbyTourType, string>> = {
  travel: "여행지",
  festival: "축제",
  accommodation: "숙소",
};

function TravelSpotsSection({
  recs,
  tabOrder,
  locale,
}: {
  recs: NearbyTourRecommendations;
  tabOrder: NearbyTourType[];
  locale: string;
}) {
  const validTabs = tabOrder.filter(
    (t): t is "travel" | "festival" | "accommodation" =>
      t === "travel" || t === "festival" || t === "accommodation"
  );
  const tabsWithData = validTabs.filter((t) => recs[t].length > 0);
  const [activeTab, setActiveTab] = useState<"travel" | "festival" | "accommodation">(
    tabsWithData[0] ?? validTabs[0] ?? "travel"
  );
  const items = recs[activeTab] ?? [];

  if (tabsWithData.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base leading-none">🧭</span>
        <h2 className="text-base font-bold text-[#1B1C1A]">주변 여행 스팟</h2>
      </div>

      {tabsWithData.length > 1 && (
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {tabsWithData.map((type) => {
            const isActive = activeTab === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setActiveTab(type)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  isActive
                    ? "border-[#D84315] bg-[#D84315] text-white"
                    : "border-gray-200 bg-white text-gray-500 hover:border-[#D84315]/40 hover:text-[#D84315]"
                }`}
              >
                {TOUR_TAB_LABELS[type]}
                <span className={`ml-1 ${isActive ? "text-white/70" : "text-gray-400"}`}>
                  {recs[type].length}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((item) => (
          <CompactCard key={item.id} item={item} type={activeTab} locale={locale} />
        ))}
      </div>
    </div>
  );
}

interface FacilityNearbySectionsProps {
  restaurants: NearbyTourItem[];
  cafes: NearbyTourItem[];
  tourRecs: NearbyTourRecommendations;
  tourTabOrder: NearbyTourType[];
  locale: string;
}

export default function FacilityNearbySections({
  restaurants,
  cafes,
  tourRecs,
  tourTabOrder,
  locale,
}: FacilityNearbySectionsProps) {
  const hasRestaurants = restaurants.length > 0;
  const hasCafes = cafes.length > 0;
  const hasTour = tourTabOrder
    .filter((t): t is "travel" | "festival" | "accommodation" =>
      t === "travel" || t === "festival" || t === "accommodation"
    )
    .some((t) => tourRecs[t].length > 0);

  if (!hasRestaurants && !hasCafes && !hasTour) return null;

  return (
    <div className="mt-8 pt-8 border-t border-gray-100">
      <div className="mb-6">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#D84315]">
          Explore Nearby
        </p>
        <h2 className="font-headline text-xl font-bold text-[#1B1C1A]">주변 탐색</h2>
      </div>

      <CompactSection
        emoji="🍴"
        title="근처 맛집"
        items={restaurants}
        type="restaurant"
        locale={locale}
      />

      <CompactSection
        emoji="☕"
        title="근처 카페"
        items={cafes}
        type="cafe"
        locale={locale}
      />

      <TravelSpotsSection recs={tourRecs} tabOrder={tourTabOrder} locale={locale} />
    </div>
  );
}
