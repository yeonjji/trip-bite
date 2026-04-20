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

  const { items, totalCount } = await getEvChargers({
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
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#14b8a6]/10 flex items-center justify-center">
          <Zap className="w-5 h-5 text-[#0d9488]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isKo ? "전기차 충전소" : "EV Charging Stations"}
          </h1>
        </div>
      </div>

      {/* 필터 */}
      <Suspense>
        <EvChargingFilters locale={locale} />
      </Suspense>

      {/* 결과 */}
      <div className="mt-6">
        {items.length === 0 ? (
          <div className="py-16 text-center">
            <Zap className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">
              {isKo ? "해당 지역에 충전소가 없습니다." : "No charging stations found in this area."}
            </p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              {isKo
                ? `총 ${totalCount.toLocaleString()}개`
                : `${totalCount.toLocaleString()} stations found`}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((charger) => (
                <EvChargingCard
                  key={`${charger.statId}-${charger.chgerId}`}
                  charger={charger}
                  locale={locale}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* 페이지네이션 */}
      {totalCount > PAGE_SIZE && (
        <div className="mt-8">
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
  );
}
