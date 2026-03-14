// P1-39: 맛집 상세 페이지

import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import type { Metadata } from "next"

import ImageGallery from "@/components/shared/ImageGallery"
import { buildAlternates } from "@/lib/utils/metadata"
import Rating from "@/components/shared/Rating"
import NaverMap from "@/components/maps/NaverMap"
import { getRestaurantDetail } from "@/lib/data/restaurants"

type Props = {
  params: Promise<{ locale: string; id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { destination, detail } = await getRestaurantDetail(id)

  const title = detail?.title ?? destination?.title ?? "맛집 상세"
  const description = detail?.overview ?? destination?.overview ?? ""
  const ogImage = detail?.firstimage ?? destination?.first_image

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    alternates: buildAlternates(`/restaurants/${id}`),
  }
}

export default async function RestaurantDetailPage({ params }: Props) {
  const { locale, id } = await params

  setRequestLocale(locale)

  const { destination, detail, intro, images } = await getRestaurantDetail(id)

  if (!destination && !detail) {
    notFound()
  }

  const title = detail?.title ?? destination?.title ?? ""
  const addr1 = detail?.addr1 ?? destination?.addr1 ?? ""
  const tel = detail?.tel ?? destination?.tel ?? ""
  const overview = detail?.overview ?? destination?.overview ?? ""
  const firstmenu = intro?.firstmenu
  const opentimefood = intro?.opentimefood
  const ratingAvg = destination?.rating_avg ?? 0
  const ratingCount = destination?.rating_count ?? 0

  const mapx = detail?.mapx ?? (destination?.mapx ? String(destination.mapx) : undefined)
  const mapy = detail?.mapy ?? (destination?.mapy ? String(destination.mapy) : undefined)
  const hasMap = mapx && mapy

  const galleryImages = images.map((img) => ({
    url: img.originimgurl,
    alt: img.imgname,
  }))

  if (detail?.firstimage && galleryImages.length === 0) {
    galleryImages.unshift({ url: detail.firstimage, alt: title })
  } else if (destination?.first_image && galleryImages.length === 0) {
    galleryImages.unshift({ url: destination.first_image, alt: title })
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-foreground">{title}</h1>

      {ratingAvg > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <Rating value={ratingAvg} size="md" showValue readonly />
          <span className="text-sm text-muted-foreground">
            ({ratingCount.toLocaleString()}{locale === "ko" ? "개 리뷰" : " reviews"})
          </span>
        </div>
      )}

      {galleryImages.length > 0 && (
        <div className="mb-6">
          <ImageGallery images={galleryImages} />
        </div>
      )}

      <div className="mb-6 space-y-3 rounded-xl border p-4">
        {addr1 && (
          <div className="flex gap-2 text-sm">
            <span className="w-20 shrink-0 font-medium text-muted-foreground">
              {locale === "ko" ? "주소" : "Address"}
            </span>
            <span className="text-foreground">{addr1}</span>
          </div>
        )}
        {tel && (
          <div className="flex gap-2 text-sm">
            <span className="w-20 shrink-0 font-medium text-muted-foreground">
              {locale === "ko" ? "전화" : "Phone"}
            </span>
            <a href={`tel:${tel}`} className="text-primary hover:underline">
              {tel}
            </a>
          </div>
        )}
        {firstmenu && (
          <div className="flex gap-2 text-sm">
            <span className="w-20 shrink-0 font-medium text-muted-foreground">
              {locale === "ko" ? "대표 메뉴" : "Menu"}
            </span>
            <span className="text-foreground">{firstmenu}</span>
          </div>
        )}
        {opentimefood && (
          <div className="flex gap-2 text-sm">
            <span className="w-20 shrink-0 font-medium text-muted-foreground">
              {locale === "ko" ? "영업시간" : "Hours"}
            </span>
            <span className="whitespace-pre-line text-foreground">{opentimefood}</span>
          </div>
        )}
      </div>

      {overview && (
        <div className="mb-6">
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            {locale === "ko" ? "소개" : "About"}
          </h2>
          <p
            className="text-sm leading-relaxed text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: overview }}
          />
        </div>
      )}

      {hasMap && (
        <div className="mb-6">
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            {locale === "ko" ? "위치" : "Location"}
          </h2>
          <div className="relative h-64 overflow-hidden rounded-xl">
            <NaverMap
              lat={parseFloat(mapy)}
              lng={parseFloat(mapx)}
              className="h-full w-full"
            />
          </div>
        </div>
      )}
    </div>
  )
}
