import { setRequestLocale } from "next-intl/server"
import type { Metadata } from "next"

import { buildAlternates } from "@/lib/utils/metadata"
import { getUpcomingFestivals } from "@/lib/data/festivals"
import HeroSearch from "@/components/shared/HeroSearch"
import HeroCarousel from "@/components/home/HeroCarousel"
import HomeQuickLinks from "@/components/home/HomeQuickLinks"
import TodayTripSection from "@/components/home/TodayTripSection"
import RecommendedCourseSection from "@/components/home/RecommendedCourseSection"
import TravelTypeSection from "@/components/home/TravelTypeSection"
import HomeFestivalsSection from "@/components/home/HomeFestivalsSection"
import FacilitiesCheckSection from "@/components/home/FacilitiesCheckSection"
import MainTravelNewsSection from "@/components/home/MainTravelNewsSection"
import VisitorCurationSection from "@/components/home/VisitorCurationSection"

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === "en" ? "Trip Bite - Korea Travel & Food" : "트립바이트 - 한국 여행 & 음식",
    description:
      locale === "en"
        ? "Discover travel destinations, restaurants, camping sites and festivals across Korea."
        : "한국의 여행지, 맛집, 캠핑장, 축제를 한눈에 탐색하세요.",
    alternates: buildAlternates(""),
  }
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const festivals = await getUpcomingFestivals(4)

  return (
    <div className="flex flex-col">
      {/* 1. Hero */}
      <section className="relative min-h-[460px] bg-white flex items-center justify-center px-4 py-24 text-center overflow-hidden">
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
          <HomeQuickLinks locale={locale} />
        </div>
      </section>

      {/* 2. 오늘의 여행 조합 */}
      <TodayTripSection locale={locale} />

      {/* 3. 자동 여행 코스 생성 */}
      <RecommendedCourseSection locale={locale} />

      {/* 4. 상황별 여행 선택 */}
      <TravelTypeSection locale={locale} />

      {/* 5. 빅데이터 여행지 큐레이션 */}
      <VisitorCurationSection locale={locale} />

      {/* 6. 이번에 가볼 만한 축제 */}
      <HomeFestivalsSection festivals={festivals} locale={locale} />

      {/* 7. 여행 전 체크 */}
      <FacilitiesCheckSection locale={locale} />

      {/* 8. 지역 축제·관광 소식 (보조) */}
      <MainTravelNewsSection />
    </div>
  )
}
