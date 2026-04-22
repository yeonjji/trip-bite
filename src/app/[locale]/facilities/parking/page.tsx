import { Suspense } from "react";
import type { Metadata } from "next";
import { ParkingCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { buildAlternates } from "@/lib/utils/metadata";
import { getParking } from "@/lib/data/parking";
import ParkingCard from "./_components/ParkingCard";
import ParkingFilters from "./_components/ParkingFilters";
import ParkingPagination from "./_components/ParkingPagination";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ zcode?: string; smprcSe?: string; page?: string }>;
}

const PAGE_SIZE = 30;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "en" ? "Parking Lots" : "주차장",
    description:
      locale === "en"
        ? "Find public parking lots across Korea."
        : "전국 공공 주차장 위치와 요금을 확인하세요.",
    alternates: buildAlternates("/facilities/parking"),
  };
}

export default async function ParkingPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { zcode, smprcSe, page: pageStr } = await searchParams;
  const isKo = locale === "ko";
  const page = Number(pageStr ?? "1") || 1;

  const { items, totalCount, error } = await getParking({
    zcode,
    smprcSe,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 pt-4 pb-8">
      <Link
        href={`/${locale}/facilities`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#0d9488] transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        {isKo ? "편의시설" : "Facilities"}
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#14b8a6]/10 flex items-center justify-center">
            <ParkingCircle className="w-4.5 h-4.5 text-[#0d9488]" />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            {isKo ? "주차장" : "Parking Lots"}
          </h1>
        </div>
        {totalCount > 0 && (
          <span className="text-sm text-muted-foreground">
            {isKo ? `총 ${totalCount.toLocaleString()}개` : `${totalCount.toLocaleString()} lots`}
          </span>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <aside className="w-full lg:w-52 lg:shrink-0">
          <div className="lg:sticky lg:top-20 bg-white border border-border rounded-2xl p-4">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              {isKo ? "필터" : "Filter"}
            </p>
            <Suspense>
              <ParkingFilters locale={locale} />
            </Suspense>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {items.length === 0 ? (
            <div className="py-20 text-center">
              <ParkingCircle className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {isKo ? "해당 지역에 주차장이 없습니다." : "No parking lots found."}
              </p>
              {error && (
                <p className="mt-3 text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 max-w-md mx-auto text-left break-all">
                  {error}
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {items.map((lot) => (
                <ParkingCard key={lot.manage_no} lot={lot} locale={locale} />
              ))}
            </div>
          )}

          {totalCount > PAGE_SIZE && (
            <div className="mt-6">
              <Suspense>
                <ParkingPagination
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
