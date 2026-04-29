import { setRequestLocale } from "next-intl/server"
import type { Metadata } from "next"

import { buildAlternates } from "@/lib/utils/metadata"
import HeroSearch from "@/components/shared/HeroSearch"
import HeroCarousel from "@/components/home/HeroCarousel"
import RegionalRecommendations from "@/components/home/RegionalRecommendations"
import MainBlogReviewSection from "@/components/home/MainBlogReviewSection"
import MainTravelNewsSection from "@/components/home/MainTravelNewsSection"

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === "en" ? "Trip Bite - Korea Travel & Food" : "트립바이트 - 한국 여행 & 음식",
    description:
      locale === "en"
        ? "Discover travel destinations, restaurants, camping sites and local specialties across Korea."
        : "한국의 여행지, 맛집, 캠핑장, 특산품을 한눈에 탐색하세요.",
    alternates: buildAlternates(""),
  }
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className="flex flex-col">
      {/* 1. 히어로 섹션 */}
      <section className="relative min-h-[420px] bg-white flex items-center justify-center px-4 py-20 text-center overflow-hidden">
        <HeroCarousel />
        <div className="relative z-20 mx-auto max-w-2xl">
          <h1 className="mb-4 font-headline text-4xl font-extrabold tracking-tight md:text-6xl" style={{ color: "#b05a42" }}>
            {locale === "en" ? "Delicious Travel, Korea" : "맛있는 여행, Korea"}
          </h1>
          <p className="mb-8 text-lg text-stone-600">
            {locale === "en"
              ? "Travel destinations, local food and camping across Korea"
              : "전국의 여행지, 맛집, 캠핑장을 한번에"}
          </p>
          <HeroSearch variant="overlay" locale={locale} />
        </div>
      </section>

      {/* 2. 지역별 추천 장소 */}
      <RegionalRecommendations />

      {/* 3. 요즘 여행자들의 후기 */}
      <MainBlogReviewSection />

      {/* 4. 지역 축제·관광 소식 */}
      <MainTravelNewsSection />
    </div>
  )
}
