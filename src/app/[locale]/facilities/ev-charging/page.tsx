import { Suspense } from "react";
import type { Metadata } from "next";
import { Zap, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { buildAlternates } from "@/lib/utils/metadata";
import { getEvChargers } from "@/lib/data/ev-charging";
import EvChargingCard from "./_components/EvChargingCard";
import EvChargingFilters from "./_components/EvChargingFilters";
import EvChargingPagination from "./_components/EvChargingPagination";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ zcode?: string; kind?: string; page?: string }>;
}

const PAGE_SIZE = 30;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "en" ? "EV Charging Stations" : "전기차 충전소",
    description:
      locale === "en"
        ? "Find EV charging stations across Korea."
        : "전국 전기차 충전소 위치를 찾아보세요.",
    alternates: buildAlternates("/facilities/ev-charging"),
  };
}

export default async function EvChargingPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { zcode, kind, page: pageStr } = await searchParams;
  const isKo = locale === "ko";
  const page = Number(pageStr ?? "1") || 1;

  const { items, totalCount, error } = await getEvChargers({
    zcode,
    kind,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 pt-4 pb-8">
      {/* 뒤로가기 */}
      <Link
        href={`/${locale}/facilities`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#0d9488] transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        {isKo ? "편의시설" : "Facilities"}
      </Link>

      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#14b8a6]/10 flex items-center justify-center">
            <Zap className="w-4.5 h-4.5 text-[#0d9488]" />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            {isKo ? "전기차 충전소" : "EV Charging Stations"}
          </h1>
        </div>
        {totalCount > 0 && (
          <span className="text-sm text-muted-foreground">
            {isKo ? `총 ${totalCount.toLocaleString()}개` : `${totalCount.toLocaleString()} stations`}
          </span>
        )}
      </div>

      {/* 사이드바 + 콘텐츠 */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* 사이드바 필터 */}
        <aside className="w-full lg:w-52 lg:shrink-0">
          <div className="lg:sticky lg:top-20 bg-white border border-border rounded-2xl p-4">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              {isKo ? "필터" : "Filter"}
            </p>
            <Suspense>
              <EvChargingFilters locale={locale} />
            </Suspense>
          </div>
        </aside>

        {/* 리스트 */}
        <div className="flex-1 min-w-0">
          {items.length === 0 ? (
            <div className="py-20 text-center">
              <Zap className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {isKo ? "해당 지역에 충전소가 없습니다." : "No charging stations found."}
              </p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                totalCount: {totalCount}
              </p>
              {error && (
                <p className="mt-3 text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 max-w-md mx-auto text-left break-all">
                  {error}
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {items.map((charger) => (
                <EvChargingCard
                  key={`${charger.statId}-${charger.chgerId}`}
                  charger={charger}
                  locale={locale}
                />
              ))}
            </div>
          )}

          {totalCount > PAGE_SIZE && (
            <div className="mt-6">
              <Suspense>
                <EvChargingPagination
                  locale={locale}
                  currentPage={page}
                  totalCount={totalCount}
                  pageSize={PAGE_SIZE}
                />
              </Suspense>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
