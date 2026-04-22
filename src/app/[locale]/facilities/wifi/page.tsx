import { Suspense } from "react";
import type { Metadata } from "next";
import { Wifi, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { buildAlternates } from "@/lib/utils/metadata";
import { getFreeWifi } from "@/lib/data/free-wifi";
import WifiCard from "./_components/WifiCard";
import WifiFilters from "./_components/WifiFilters";
import WifiPagination from "./_components/WifiPagination";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ zcode?: string; page?: string }>;
}

const PAGE_SIZE = 30;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "en" ? "Public Wi-Fi" : "공공 와이파이",
    description:
      locale === "en"
        ? "Find free public Wi-Fi spots across Korea."
        : "전국 무료 공공 와이파이 위치를 찾아보세요.",
    alternates: buildAlternates("/facilities/wifi"),
  };
}

export default async function WifiPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { zcode, page: pageStr } = await searchParams;
  const isKo = locale === "ko";
  const page = Number(pageStr ?? "1") || 1;

  const { items, totalCount } = await getFreeWifi({ zcode, page, pageSize: PAGE_SIZE });

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
            <Wifi className="w-4.5 h-4.5 text-[#0d9488]" />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            {isKo ? "공공 와이파이" : "Public Wi-Fi"}
          </h1>
        </div>
        {totalCount > 0 && (
          <span className="text-sm text-muted-foreground">
            {isKo ? `총 ${totalCount.toLocaleString()}개` : `${totalCount.toLocaleString()} spots`}
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
              <WifiFilters locale={locale} />
            </Suspense>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {items.length === 0 ? (
            <div className="py-20 text-center">
              <Wifi className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {isKo ? "해당 지역에 와이파이 정보가 없습니다." : "No Wi-Fi spots found."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {items.map((wifi) => (
                <WifiCard key={wifi.id} wifi={wifi} locale={locale} />
              ))}
            </div>
          )}

          {totalCount > PAGE_SIZE && (
            <div className="mt-6">
              <Suspense>
                <WifiPagination
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
