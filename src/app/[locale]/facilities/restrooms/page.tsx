import { Suspense } from "react";
import type { Metadata } from "next";
import { Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { buildAlternates } from "@/lib/utils/metadata";
import { getPublicToilets } from "@/lib/data/public-toilets";
import ToiletCard from "./_components/ToiletCard";
import ToiletFilters from "./_components/ToiletFilters";
import ToiletPagination from "./_components/ToiletPagination";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ zcode?: string; baby_care?: string; page?: string }>;
}

const PAGE_SIZE = 30;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "en" ? "Public Restrooms" : "공중화장실",
    description:
      locale === "en"
        ? "Find public restrooms across Korea."
        : "전국 공중화장실 위치를 찾아보세요.",
    alternates: buildAlternates("/facilities/restrooms"),
  };
}

export default async function RestroomsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { zcode, baby_care, page: pageStr } = await searchParams;
  const isKo = locale === "ko";
  const page = Number(pageStr ?? "1") || 1;

  const { items, totalCount } = await getPublicToilets({
    zcode,
    baby_care: baby_care === "Y",
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

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#14b8a6]/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-[#0d9488]" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          {isKo ? "공중화장실" : "Public Restrooms"}
        </h1>
      </div>

      <Suspense>
        <ToiletFilters locale={locale} />
      </Suspense>

      <div className="mt-6">
        {items.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">
              {isKo ? "해당 지역에 화장실 정보가 없습니다." : "No restrooms found in this area."}
            </p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              {isKo ? `총 ${totalCount.toLocaleString()}개` : `${totalCount.toLocaleString()} restrooms`}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((toilet) => (
                <ToiletCard key={toilet.id} toilet={toilet} locale={locale} />
              ))}
            </div>
          </>
        )}
      </div>

      {totalCount > PAGE_SIZE && (
        <div className="mt-8">
          <Suspense>
            <ToiletPagination
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
