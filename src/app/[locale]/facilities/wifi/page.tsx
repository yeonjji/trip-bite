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

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#14b8a6]/10 flex items-center justify-center">
          <Wifi className="w-5 h-5 text-[#0d9488]" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          {isKo ? "공공 와이파이" : "Public Wi-Fi"}
        </h1>
      </div>

      <Suspense>
        <WifiFilters locale={locale} />
      </Suspense>

      <div className="mt-6">
        {items.length === 0 ? (
          <div className="py-16 text-center">
            <Wifi className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">
              {isKo ? "해당 지역에 와이파이 정보가 없습니다." : "No Wi-Fi spots found in this area."}
            </p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              {isKo ? `총 ${totalCount.toLocaleString()}개` : `${totalCount.toLocaleString()} Wi-Fi spots`}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((wifi) => (
                <WifiCard key={wifi.id} wifi={wifi} locale={locale} />
              ))}
            </div>
          </>
        )}
      </div>

      {totalCount > PAGE_SIZE && (
        <div className="mt-8">
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
  );
}
