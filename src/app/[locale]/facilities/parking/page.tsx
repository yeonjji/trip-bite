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

  const { items, totalCount } = await getParking({
    zcode,
    smprcSe,
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
          <ParkingCircle className="w-5 h-5 text-[#0d9488]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isKo ? "주차장" : "Parking Lots"}
          </h1>
        </div>
      </div>

      {/* 필터 */}
      <Suspense>
        <ParkingFilters locale={locale} />
      </Suspense>

      {/* 결과 */}
      <div className="mt-6">
        {items.length === 0 ? (
          <div className="py-16 text-center">
            <ParkingCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">
              {isKo ? "해당 지역에 주차장이 없습니다." : "No parking lots found in this area."}
            </p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              {isKo
                ? `총 ${totalCount.toLocaleString()}개`
                : `${totalCount.toLocaleString()} parking lots found`}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((lot) => (
                <ParkingCard
                  key={lot.prkplceNo}
                  lot={lot}
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
  );
}
