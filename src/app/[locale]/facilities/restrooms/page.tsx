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

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#14b8a6]/10 flex items-center justify-center">
            <Users className="w-4.5 h-4.5 text-[#0d9488]" />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            {isKo ? "공중화장실" : "Public Restrooms"}
          </h1>
        </div>
        {totalCount > 0 && (
          <span className="text-sm text-muted-foreground">
            {isKo ? `총 ${totalCount.toLocaleString()}개` : `${totalCount.toLocaleString()} restrooms`}
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
              <ToiletFilters locale={locale} />
            </Suspense>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {items.length === 0 ? (
            <div className="py-20 text-center">
              <Users className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {isKo ? "해당 지역에 화장실 정보가 없습니다." : "No restrooms found."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {items.map((toilet) => (
                <ToiletCard key={toilet.id} toilet={toilet} locale={locale} />
              ))}
            </div>
          )}

          {totalCount > PAGE_SIZE && (
            <div className="mt-6">
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
      </div>
    </div>
  );
}
