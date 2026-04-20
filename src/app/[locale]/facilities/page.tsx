import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Zap, Wifi, MapPin, ParkingCircle } from "lucide-react";
import { buildAlternates } from "@/lib/utils/metadata";
import FacilityCategoryCard from "./_components/FacilityCategoryCard";
import NearbyFacilities from "./_components/NearbyFacilities";

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
    title: locale === "en" ? "Facilities" : "편의시설",
    description:
      locale === "en"
        ? "Find essential facilities during your travels in Korea."
        : "여행 중 필요한 편의시설을 찾아보세요.",
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
      title: isKo ? "공용 와이파이" : "Public Wi-Fi",
      description: isKo ? "무료 공용 와이파이 위치" : "Free public Wi-Fi locations",
      badge: isKo ? "준비중" : "Coming Soon",
      comingSoon: true,
    },
    {
      href: `/${locale}/facilities/restrooms`,
      icon: MapPin,
      title: isKo ? "공중화장실" : "Restrooms",
      description: isKo ? "공중화장실 위치 및 정보" : "Public restroom locations",
      badge: isKo ? "준비중" : "Coming Soon",
      comingSoon: true,
    },
    {
      href: `/${locale}/facilities/parking`,
      icon: ParkingCircle,
      title: isKo ? "주차장" : "Parking",
      description: isKo ? "공영주차장 위치 및 요금" : "Public parking lots & fees",
      badge: isKo ? "준비중" : "Coming Soon",
      comingSoon: true,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFDF5]">
      {/* 헤더 배너 */}
      <div className="bg-gradient-to-br from-[#14b8a6] to-[#0d9488] px-4 py-10">
        <div className="mx-auto max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/70 mb-2">
            {isKo ? "TRAVEL ESSENTIALS" : "TRAVEL ESSENTIALS"}
          </p>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isKo ? "편의시설 안내" : "Facilities & Comfort"}
          </h1>
          <p className="text-white/80 text-sm leading-relaxed">
            {isKo
              ? "여행 중 필요한 편의시설을 한눈에 찾아보세요"
              : "Navigate your journey with ease. Find essential services tailored for the modern traveler."}
          </p>
        </div>
      </div>

      {/* 카테고리 카드 */}
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
        {/* EV 충전소 — Featured (전폭) */}
        <FacilityCategoryCard
          href={`/${locale}/facilities/ev-charging`}
          icon={Zap}
          title={isKo ? "전기차 충전소" : "EV Charging Hubs"}
          description={
            isKo
              ? "전국 급속·완속 충전소 위치를 확인하세요"
              : "Find high-speed charging points on your route."
          }
          badge={isKo ? "운영중" : "SUSTAINABLE CHOICE"}
          featured
        />

        {/* Coming Soon — 2열 그리드 */}
        <div className="grid grid-cols-2 gap-4">
          {categories.map((cat) => (
            <FacilityCategoryCard key={cat.href} {...cat} />
          ))}
        </div>

        {/* 내 주변 편의시설 */}
        <NearbyFacilities locale={locale} />
      </div>
    </div>
  );
}
