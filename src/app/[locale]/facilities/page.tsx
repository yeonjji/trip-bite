import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Zap, Wifi, Users, ParkingCircle } from "lucide-react";
import { buildAlternates } from "@/lib/utils/metadata";
import FacilityCategoryCard from "./_components/FacilityCategoryCard";
import FacilityCurationSection from "./_components/FacilityCurationSection";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "en" ? "Travel Facilities Guide" : "여행 편의시설 가이드",
    description:
      locale === "en"
        ? "Find parking, public Wi-Fi, EV charging stations, and restrooms for your travels in Korea."
        : "주차장, 공공 와이파이, 전기차 충전소, 공중화장실 등 여행 중 필요한 편의시설을 한눈에 확인하세요.",
    alternates: buildAlternates("/facilities"),
  };
}

export default async function FacilitiesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isKo = locale === "ko";

  const categories = [
    {
      href: `/${locale}/facilities/wifi`,
      icon: Wifi,
      title: isKo ? "공공 와이파이" : "Public Wi-Fi",
      available: true,
    },
    {
      href: `/${locale}/facilities/ev-charging`,
      icon: Zap,
      title: isKo ? "전기차 충전소" : "EV Charging",
      available: true,
    },
    {
      href: `/${locale}/facilities/restrooms`,
      icon: Users,
      title: isKo ? "공중화장실" : "Restrooms",
      available: true,
    },
    {
      href: `/${locale}/facilities/parking`,
      icon: ParkingCircle,
      title: isKo ? "주차장" : "Parking",
      available: true,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFDF5]">
      {/* 타이틀 */}
      <div className="px-4 pt-10 pb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {isKo ? "편의시설 한눈에 보기" : "Facilities & Comfort"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
          {isKo
            ? "여행 중 필요한 다양한 편의시설을 쉽게 찾고\n이용할 수 있습니다."
            : "Find essential services tailored for\nthe modern traveler."}
        </p>
      </div>

      {/* 카테고리 그리드 */}
      <div className="mx-auto max-w-2xl px-4 pb-4">
        <div className="grid grid-cols-2 gap-3">
          {categories.map((cat) => (
            <FacilityCategoryCard key={cat.href} {...cat} />
          ))}
        </div>
      </div>

      {/* 편의시설 큐레이션 */}
      <div className="mx-auto max-w-2xl px-4 pb-16">
        <FacilityCurationSection locale={locale} />
      </div>
    </div>
  );
}
