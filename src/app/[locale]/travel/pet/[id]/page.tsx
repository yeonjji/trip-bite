import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import type { Metadata } from "next"

import { getPetPlaceDetail } from "@/lib/data/pet-places"
import { tourApi } from "@/lib/api/tour-api"
import { buildAlternates } from "@/lib/utils/metadata"
import Rating from "@/components/shared/Rating"
import ImageGallery from "@/components/shared/ImageGallery"
import ReviewSection from "@/components/reviews/ReviewSection"
import TravelMap from "../../_components/TravelMap"
import type { TourImage } from "@/types/tour-api"

type Props = {
  params: Promise<{ locale: string; id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { place } = await getPetPlaceDetail(id)

  if (!place) return { title: "반려동물 여행" }

  return {
    title: place.title,
    description: place.overview
      ? place.overview.replace(/<[^>]*>/g, "").slice(0, 160)
      : undefined,
    openGraph: {
      title: place.title,
      images: place.first_image ? [{ url: place.first_image }] : [],
    },
    alternates: buildAlternates(`/travel/pet/${id}`),
  }
}

export default async function PetPlaceDetailPage({ params }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)

  const { place, petTourInfo } = await getPetPlaceDetail(id)
  if (!place) notFound()

  // 이미지 fetch (에러 시 빈 배열)
  let images: TourImage[] = []
  try {
    const imgRes = await tourApi.detailImage(id)
    const imgItems = imgRes.response.body.items
    images = imgItems !== "" ? imgItems.item : []
  } catch {
    images = []
  }

  const galleryImages = images.map((img) => ({
    url: img.originimgurl,
    alt: img.imgname,
  }))
  if (galleryImages.length === 0 && place.first_image) {
    galleryImages.push({ url: place.first_image, alt: place.title })
  }

  const lat = place.mapy ?? null
  const lng = place.mapx ?? null
  const isKo = locale === "ko"

  const PET_CL_MAP: Record<string, string> = {
    "1": isKo ? "실내" : "Indoor",
    "2": isKo ? "실외" : "Outdoor",
    "3": isKo ? "실내외" : "Indoor & Outdoor",
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-1 text-sm text-muted-foreground">
        <a href={`/${locale}/travel/pet`} className="hover:underline">
          {isKo ? "반려동물 여행" : "Pet-Friendly Travel"}
        </a>
      </div>

      <h1 className="mb-2 text-2xl font-bold text-foreground">{place.title}</h1>

      <div className="mb-4 flex items-center gap-3">
        <Rating value={place.rating_avg} showValue readonly />
        {place.rating_count > 0 && (
          <span className="text-sm text-muted-foreground">
            ({place.rating_count.toLocaleString()})
          </span>
        )}
      </div>

      {galleryImages.length > 0 && (
        <div className="mb-6">
          <ImageGallery images={galleryImages} />
        </div>
      )}

      {/* 기본 정보 카드 */}
      <div className="mb-6 space-y-3 rounded-xl border p-4">
        {place.addr1 && (
          <div className="flex gap-2 text-sm">
            <span className="w-24 shrink-0 font-medium text-muted-foreground">
              {isKo ? "주소" : "Address"}
            </span>
            <span className="text-foreground">{place.addr1} {place.addr2}</span>
          </div>
        )}
        {place.tel && (
          <div className="flex gap-2 text-sm">
            <span className="w-24 shrink-0 font-medium text-muted-foreground">
              {isKo ? "전화" : "Phone"}
            </span>
            <a href={`tel:${place.tel}`} className="text-primary hover:underline">
              {place.tel}
            </a>
          </div>
        )}
      </div>

      {/* 반려동물 동반 정보 (DB + TourAPI 통합) */}
      {(place.pet_acmpny_cl || place.acmpny_type_cd || place.rel_pet_info ||
        petTourInfo?.relafrpetspecies || petTourInfo?.acmpanypetsizerange ||
        petTourInfo?.relaacmpanypetfee || petTourInfo?.acmpanypetcount ||
        petTourInfo?.petaceptdivision || petTourInfo?.petinfo) && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h2 className="mb-3 text-base font-semibold text-amber-800">
            🐾 {isKo ? "반려동물 동반 정보" : "Pet Companion Info"}
          </h2>
          <dl className="flex flex-col gap-2 text-sm">
            {place.pet_acmpny_cl && (
              <div className="flex gap-2">
                <dt className="min-w-24 font-medium text-amber-700">
                  {isKo ? "이용 구역" : "Area"}
                </dt>
                <dd className="text-amber-900">
                  {PET_CL_MAP[place.pet_acmpny_cl] ?? place.pet_acmpny_cl}
                </dd>
              </div>
            )}
            {place.acmpny_type_cd && (
              <div className="flex gap-2">
                <dt className="min-w-24 font-medium text-amber-700">
                  {isKo ? "동반 동물" : "Allowed Animals"}
                </dt>
                <dd className="text-amber-900">{place.acmpny_type_cd}</dd>
              </div>
            )}
            {petTourInfo?.relafrpetspecies && (
              <div className="flex gap-2">
                <dt className="min-w-24 font-medium text-amber-700">
                  {isKo ? "반려동물 종류" : "Pet Species"}
                </dt>
                <dd className="text-amber-900">{petTourInfo.relafrpetspecies}</dd>
              </div>
            )}
            {petTourInfo?.acmpanypetsizerange && (
              <div className="flex gap-2">
                <dt className="min-w-24 font-medium text-amber-700">
                  {isKo ? "동반 가능 크기" : "Allowed Size"}
                </dt>
                <dd className="text-amber-900">{petTourInfo.acmpanypetsizerange}</dd>
              </div>
            )}
            {petTourInfo?.acmpanypetcount && (
              <div className="flex gap-2">
                <dt className="min-w-24 font-medium text-amber-700">
                  {isKo ? "최대 동반 수" : "Max Pets"}
                </dt>
                <dd className="text-amber-900">{petTourInfo.acmpanypetcount}</dd>
              </div>
            )}
            {petTourInfo?.relaacmpanypetfee && (
              <div className="flex gap-2">
                <dt className="min-w-24 font-medium text-amber-700">
                  {isKo ? "반려동물 비용" : "Pet Fee"}
                </dt>
                <dd className="text-amber-900">{petTourInfo.relaacmpanypetfee}</dd>
              </div>
            )}
            {petTourInfo?.petaceptdivision && (
              <div className="flex gap-2">
                <dt className="min-w-24 font-medium text-amber-700">
                  {isKo ? "수용 구분" : "Acceptance"}
                </dt>
                <dd className="text-amber-900">{petTourInfo.petaceptdivision}</dd>
              </div>
            )}
            {place.rel_pet_info && (
              <div className="flex gap-2">
                <dt className="min-w-24 font-medium text-amber-700">
                  {isKo ? "동반 규정" : "Rules"}
                </dt>
                <dd className="text-amber-900 leading-relaxed">{place.rel_pet_info}</dd>
              </div>
            )}
            {petTourInfo?.petinfo && (
              <div className="flex gap-2">
                <dt className="min-w-24 font-medium text-amber-700">
                  {isKo ? "추가 안내" : "More Info"}
                </dt>
                <dd className="text-amber-900 leading-relaxed">{petTourInfo.petinfo}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {place.overview && (
        <div className="mb-6">
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            {isKo ? "소개" : "Overview"}
          </h2>
          <p
            className="leading-relaxed text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: place.overview }}
          />
        </div>
      )}

      {lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng) && (
        <div className="mb-6">
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            {isKo ? "위치" : "Location"}
          </h2>
          <TravelMap lat={lat} lng={lng} title={place.title} />
        </div>
      )}

      <div className="mb-6">
        <ReviewSection targetType="destination" targetId={place.content_id} />
      </div>
    </div>
  )
}
