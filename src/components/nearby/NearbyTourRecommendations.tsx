"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, MapPin } from "lucide-react";

import type {
  NearbyTourItem,
  NearbyTourRecommendations,
  NearbyTourType,
} from "@/lib/data/nearby-tour-recommendations";
import { NEARBY_TOUR_PLACEHOLDER_IMAGE } from "@/lib/data/nearby-tour-recommendations";

const LABELS: Record<NearbyTourType, string> = {
  travel: "여행지",
  festival: "축제",
  accommodation: "숙소",
};

const EMPTY_TEXT: Record<NearbyTourType, string> = {
  travel: "근처 여행지 정보가 아직 없습니다.",
  festival: "근처 축제 정보가 아직 없습니다.",
  accommodation: "근처 숙소 정보가 아직 없습니다.",
};

function buildNaverSearchUrl(item: NearbyTourItem) {
  const query = item.address ? `${item.title} ${item.address}` : item.title;
  return `https://map.naver.com/v5/search/${encodeURIComponent(query)}?c=${item.lng},${item.lat},15,0,0,0,dh`;
}

function getItemHref(item: NearbyTourItem, locale: string) {
  if (item.type === "travel") return { href: `/${locale}/travel/${item.contentId}`, external: false };
  if (item.type === "festival") return { href: `/${locale}/events/${item.contentId}`, external: false };
  return { href: buildNaverSearchUrl(item), external: true };
}

function NearbyTourCard({ item, locale }: { item: NearbyTourItem; locale: string }) {
  const [imageSrc, setImageSrc] = useState(item.image || NEARBY_TOUR_PLACEHOLDER_IMAGE);
  const isPlaceholder = imageSrc === NEARBY_TOUR_PLACEHOLDER_IMAGE;
  const { href, external } = getItemHref(item, locale);

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F4F1E9]">
        <Image
          src={imageSrc}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 88vw, 260px"
          unoptimized
          className={isPlaceholder ? "object-contain p-8 opacity-50" : "object-cover"}
          onError={() => setImageSrc(NEARBY_TOUR_PLACEHOLDER_IMAGE)}
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-[#D84315] shadow-sm">
          {LABELS[item.type]}
        </span>
      </div>

      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 font-headline text-base font-bold leading-snug text-[#1B1C1A]">
            {item.title}
          </h3>
          <span className="shrink-0 rounded-full bg-[#FFF3EF] px-2 py-0.5 text-xs font-semibold text-[#D84315]">
            {item.distance}km
          </span>
        </div>

        {item.address && (
          <p className="mb-4 flex gap-1 text-xs leading-relaxed text-gray-500">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-2">{item.address}</span>
          </p>
        )}

        {external ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#1B1C1A] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#D84315]"
          >
            상세보기 <ArrowRight className="h-4 w-4" />
          </a>
        ) : (
          <Link
            href={href}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#1B1C1A] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#D84315]"
          >
            상세보기 <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </article>
  );
}

export default function NearbyTourRecommendationsSection({
  recommendations,
  tabOrder,
  locale,
}: {
  recommendations: NearbyTourRecommendations;
  tabOrder: NearbyTourType[];
  locale: string;
}) {
  const orderedTabs = useMemo(
    () => tabOrder.filter((type, index, arr) => arr.indexOf(type) === index),
    [tabOrder]
  );
  const hasAnyItems = orderedTabs.some((type) => recommendations[type].length > 0);
  const firstTabWithData = orderedTabs.find((type) => recommendations[type].length > 0) ?? orderedTabs[0] ?? "travel";
  const [activeTab, setActiveTab] = useState<NearbyTourType>(firstTabWithData);
  const activeItems = recommendations[activeTab] ?? [];

  if (orderedTabs.length === 0) return null;

  return (
    <section className="mb-6">
      <div className="mb-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#D84315]">Nearby</p>
        <h2 className="font-headline text-xl font-bold text-[#1B1C1A]">
          이 주변도 함께 둘러보세요
        </h2>
      </div>

      {!hasAnyItems ? (
        <p className="rounded-xl bg-[#F9F7EF] px-4 py-3 text-sm text-gray-500">
          주변 정보가 아직 없습니다.
        </p>
      ) : (
        <>
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {orderedTabs.map((type) => {
              const isActive = activeTab === type;
              const count = recommendations[type].length;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActiveTab(type)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? "border-[#D84315] bg-[#D84315] text-white"
                      : "border-gray-100 bg-white text-gray-500 hover:border-[#D84315]/30 hover:text-[#D84315]"
                  }`}
                >
                  {LABELS[type]}
                  <span className={isActive ? "ml-1 text-white/80" : "ml-1 text-gray-400"}>{count}</span>
                </button>
              );
            })}
          </div>

          {activeItems.length === 0 ? (
            <p className="rounded-xl bg-[#F9F7EF] px-4 py-3 text-sm text-gray-500">
              {EMPTY_TEXT[activeTab]}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeItems.map((item) => (
                <NearbyTourCard key={item.id} item={item} locale={locale} />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
