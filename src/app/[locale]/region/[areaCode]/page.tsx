// P4-09: 지역 허브 페이지 (서버 컴포넌트)

import Link from "next/link"
import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import type { Metadata } from "next"

import { getDestinations } from "@/lib/data/destinations"
import { getRestaurants } from "@/lib/data/restaurants"
import { getCampingSites } from "@/lib/data/camping"
import { getSpecialties } from "@/lib/data/specialties"
import { getAreaName, AREA_CODE_MAP } from "@/lib/constants/area-codes"
import TravelCard from "@/components/cards/TravelCard"
import RestaurantCard from "@/components/cards/RestaurantCard"
import CampingCard from "@/components/cards/CampingCard"
import SpecialtyCard from "@/components/cards/SpecialtyCard"
import WeatherWidget from "@/components/weather/WeatherWidget"
import type { Destination } from "@/types/database"
import type { TourSpotBase, RestaurantDetail } from "@/types/tour-api"

type Props = {
  params: Promise<{ locale: string; areaCode: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { areaCode, locale } = await params
  const area = AREA_CODE_MAP[areaCode]

  if (!area) {
    return { title: "지역" }
  }

  const name = locale === "en" ? area.nameEn : area.nameKo

  return {
    title: `${name} 여행 정보`,
    description: `${name}의 여행지, 맛집, 캠핑장, 특산품을 한눈에 확인하세요.`,
  }
}

export default async function RegionHubPage({ params }: Props) {
  const { locale, areaCode } = await params

  setRequestLocale(locale)

  const area = AREA_CODE_MAP[areaCode]
  if (!area) notFound()

  const areaName = locale === "en" ? area.nameEn : area.nameKo

  const [destinationsResult, restaurantsResult, campingResult, specialtiesResult] =
    await Promise.all([
      getDestinations({ areaCode, pageSize: 4 }),
      getRestaurants({ areaCode, pageSize: 4 }),
      getCampingSites({ pageSize: 4 }),
      getSpecialties({ areaCode, pageSize: 4 }),
    ])

  const destinations = destinationsResult.items
  const restaurants = restaurantsResult.items
  const campingSites = campingResult.items
  const specialties = specialtiesResult.items

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">{areaName}</h1>
        <p className="mt-2 text-muted-foreground">
          {areaName}의 여행지, 맛집, 캠핑장, 특산품 정보
        </p>
      </div>

      {/* 날씨 위젯 */}
      <div className="mb-8">
        <WeatherWidget areaCode={areaCode} />
      </div>

      {/* 여행지 섹션 */}
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">여행지</h2>
          <Link
            href={`/${locale}/travel?areaCode=${areaCode}`}
            className="text-sm text-primary hover:underline"
          >
            더 보기
          </Link>
        </div>
        {destinations.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {destinations.map((item: Destination) => (
              <TravelCard
                key={item.content_id}
                item={{
                  contentid: item.content_id,
                  title: item.title,
                  addr1: item.addr1,
                  areacode: item.area_code,
                  firstimage: item.first_image,
                } as TourSpotBase}
                locale={locale}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">등록된 여행지가 없습니다.</p>
        )}
      </section>

      {/* 맛집 섹션 */}
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">맛집</h2>
          <Link
            href={`/${locale}/restaurants?areaCode=${areaCode}`}
            className="text-sm text-primary hover:underline"
          >
            더 보기
          </Link>
        </div>
        {restaurants.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {restaurants.map((item: Destination) => (
              <RestaurantCard
                key={item.content_id}
                item={{
                  contentid: item.content_id,
                  title: item.title,
                  addr1: item.addr1,
                  areacode: item.area_code,
                  firstimage: item.first_image,
                } as RestaurantDetail}
                locale={locale}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">등록된 맛집이 없습니다.</p>
        )}
      </section>

      {/* 캠핑장 섹션 */}
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">캠핑장</h2>
          <Link
            href={`/${locale}/camping`}
            className="text-sm text-primary hover:underline"
          >
            더 보기
          </Link>
        </div>
        {campingSites.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {campingSites.map((item) => (
              <CampingCard
                key={item.content_id}
                item={{
                  contentId: item.content_id,
                  facltNm: item.faclt_nm,
                  doNm: item.do_nm,
                  sigunguNm: item.sigungu_nm,
                  addr1: item.addr1,
                  firstImageUrl: item.first_image_url,
                }}
                locale={locale}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">등록된 캠핑장이 없습니다.</p>
        )}
      </section>

      {/* 특산품 섹션 */}
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">특산품</h2>
          <Link
            href={`/${locale}/specialties?areaCode=${areaCode}`}
            className="text-sm text-primary hover:underline"
          >
            더 보기
          </Link>
        </div>
        {specialties.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {specialties.map((item) => (
              <SpecialtyCard
                key={item.id}
                item={item}
                locale={locale}
                regionName={getAreaName(areaCode, locale === "en" ? "en" : "ko")}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">등록된 특산품이 없습니다.</p>
        )}
      </section>
    </div>
  )
}
