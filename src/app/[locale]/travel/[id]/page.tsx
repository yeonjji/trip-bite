import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import type { Metadata } from "next"

import { getDestinationDetail } from "@/lib/data/destinations"
import { buildAlternates } from "@/lib/utils/metadata"
import { getAccessibilityInfo } from "@/lib/data/accessibility"
import Rating from "@/components/shared/Rating"
import ImageGallery from "@/components/shared/ImageGallery"
import ReviewSection from "@/components/reviews/ReviewSection"
import AccessibilityBadge from "@/components/shared/AccessibilityBadge"
import WeatherWidget from "@/components/weather/WeatherWidget"
import TravelMap from "../_components/TravelMap"

type Props = {
  params: Promise<{ locale: string; id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { detail } = await getDestinationDetail(id)

  if (!detail) {
    return { title: "여행지" }
  }

  return {
    title: detail.title,
    description: detail.overview
      ? detail.overview.replace(/<[^>]*>/g, "").slice(0, 160)
      : undefined,
    openGraph: {
      title: detail.title,
      description: detail.overview
        ? detail.overview.replace(/<[^>]*>/g, "").slice(0, 160)
        : undefined,
      images: detail.firstimage ? [{ url: detail.firstimage }] : [],
    },
    alternates: buildAlternates(`/travel/${id}`),
  }
}

export default async function TravelDetailPage({ params }: Props) {
  const { locale, id } = await params

  setRequestLocale(locale)

  const { destination, detail, images } = await getDestinationDetail(id)

  if (!detail && !destination) {
    notFound()
  }

  const accessibility = destination?.id
    ? await getAccessibilityInfo(destination.id)
    : null

  const title = detail?.title ?? destination?.title ?? ""
  const addr1 = detail?.addr1 ?? destination?.addr1 ?? ""
  const addr2 = detail?.addr2 ?? destination?.addr2
  const tel = detail?.tel ?? destination?.tel
  const overview = detail?.overview ?? destination?.overview
  const mapx = detail?.mapx ?? (destination?.mapx !== undefined ? String(destination.mapx) : undefined)
  const mapy = detail?.mapy ?? (destination?.mapy !== undefined ? String(destination.mapy) : undefined)

  const lat = mapy ? parseFloat(mapy) : null
  const lng = mapx ? parseFloat(mapx) : null

  const galleryImages = images.map((img) => ({
    url: img.originimgurl,
    alt: img.imgname,
  }))

  if (galleryImages.length === 0 && (detail?.firstimage || destination?.first_image)) {
    const coverUrl = detail?.firstimage ?? destination?.first_image ?? ""
    galleryImages.push({ url: coverUrl, alt: title })
  }

  const ratingAvg = destination?.rating_avg ?? 0
  const ratingCount = destination?.rating_count ?? 0
  const areaCode = destination?.area_code

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-foreground">{title}</h1>

      <div className="mb-4 flex items-center gap-3">
        <Rating value={ratingAvg} showValue readonly />
        {ratingCount > 0 && (
          <span className="text-sm text-muted-foreground">
            ({ratingCount.toLocaleString()})
          </span>
        )}
      </div>

      {accessibility && (
        accessibility.pet_possible ||
        accessibility.wheelchair ||
        accessibility.foreign_friendly
      ) && (
        <div className="mb-4 flex flex-wrap gap-2">
          {accessibility.pet_possible && <AccessibilityBadge type="pet" />}
          {accessibility.wheelchair && <AccessibilityBadge type="wheelchair" />}
          {accessibility.foreign_friendly && <AccessibilityBadge type="foreign" />}
        </div>
      )}

      {galleryImages.length > 0 && (
        <div className="mb-6">
          <ImageGallery images={galleryImages} />
        </div>
      )}

      <div className="mb-6 flex flex-col gap-2 text-sm text-muted-foreground">
        {addr1 && (
          <p>
            <span className="font-medium text-foreground">
              {locale === "ko" ? "주소" : "Address"}
            </span>{" "}
            {addr1} {addr2}
          </p>
        )}
        {tel && (
          <p>
            <span className="font-medium text-foreground">
              {locale === "ko" ? "전화" : "Phone"}
            </span>{" "}
            <a href={`tel:${tel}`} className="hover:underline">
              {tel}
            </a>
          </p>
        )}
      </div>

      {overview && (
        <div className="mb-6">
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            {locale === "ko" ? "소개" : "Overview"}
          </h2>
          <p
            className="leading-relaxed text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: overview }}
          />
        </div>
      )}

      {lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng) && (
        <div className="mb-6">
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            {locale === "ko" ? "위치" : "Location"}
          </h2>
          <TravelMap lat={lat} lng={lng} title={title} />
        </div>
      )}

      {areaCode && (
        <div className="mb-6">
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            {locale === "ko" ? "현재 날씨" : "Current Weather"}
          </h2>
          <WeatherWidget areaCode={areaCode} />
        </div>
      )}

      <div className="mb-6">
        <ReviewSection
          targetType="destination"
          targetId={destination?.content_id ?? id}
        />
      </div>
    </div>
  )
}
