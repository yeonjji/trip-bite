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
  searchParams: Promise<{ zcode?: string; sigungu?: string; smprcSe?: string; page?: string }>;
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
  const { zcode, sigungu, smprcSe, page: pageStr } = await searchParams;
  const isKo = locale === "ko";
  const page = Number(pageStr ?? "1") || 1;

  const { items, totalCount, error } = await getParking({
    zcode,
    sigunguName: sigungu,
    smprcSe,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="bg-[#F9F7F0] min-h-screen">
      <div className="max-w-7xl mx-auto flex">
        {/* 사이드바 */}
        <aside className="hidden lg:flex w-72 shrink-0 border-r border-gray-200 bg-[#F9F7F0] flex-col gap-2 px-6 py-8 sticky top-[var(--header-height,64px)] h-[calc(100vh-64px)] overflow-y-auto">
          <Suspense>
            <ParkingFilters locale={locale} />
          </Suspense>
        </aside>

        {/* 메인 */}
        <main className="flex-1 min-w-0 px-8 py-8">
          <Link
            href={`/${locale}/facilities`}
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-orange-700 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {isKo ? "편의시설" : "Facilities"}
          </Link>

          <div className="flex items-end justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                {isKo ? "주차장" : "Parking Lots"}
              </h1>
              {totalCount > 0 && (
                <p className="text-base text-slate-500 mt-1">
                  {isKo
                    ? `전국 ${totalCount.toLocaleString()}개 주차장`
                    : `${totalCount.toLocaleString()} parking lots nationwide`}
                </p>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm">
              <ParkingCircle className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-600">
                {isKo ? "공공 주차장" : "Public Parking"}
              </span>
            </div>
          </div>

          {/* 모바일 필터 */}
          <div className="lg:hidden mb-6 bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <Suspense>
              <ParkingFilters locale={locale} />
            </Suspense>
          </div>

          {items.length === 0 ? (
            <div className="py-20 text-center">
              <ParkingCircle className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">
                {isKo ? "해당 지역에 주차장이 없습니다." : "No parking lots found."}
              </p>
              {error && (
                <p className="mt-3 text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 max-w-md mx-auto text-left break-all">
                  {error}
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {items.map((lot) => (
                <ParkingCard key={lot.manage_no} lot={lot} locale={locale} />
              ))}
            </div>
          )}

          {totalCount > PAGE_SIZE && (
            <div className="mt-12">
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
        </main>
      </div>
    </div>
  );
}
