import { notFound } from "next/navigation"
import type { Metadata } from "next"

import ImageGallery from "@/components/shared/ImageGallery"
import { buildAlternates } from "@/lib/utils/metadata"
import Rating from "@/components/shared/Rating"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getCampingSiteDetail } from "@/lib/data/camping"

import CampingMap from "./_components/CampingMap"

interface PageProps {
  params: Promise<{ locale: string; id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const { site, detail } = await getCampingSiteDetail(id)

  const name = detail?.facltNm ?? site?.faclt_nm ?? "캠핑장"
  const description = detail?.lineIntro ?? detail?.intro ?? site?.line_intro ?? ""

  return {
    title: name,
    description,
    openGraph: {
      title: name,
      description,
      images: detail?.firstImageUrl
        ? [{ url: detail.firstImageUrl }]
        : site?.first_image_url
          ? [{ url: site.first_image_url }]
          : [],
    },
    alternates: buildAlternates(`/camping/${id}`),
  }
}

export default async function CampingDetailPage({ params }: PageProps) {
  const { id } = await params
  const { site, detail, images } = await getCampingSiteDetail(id)

  if (!site && !detail) {
    notFound()
  }

  const name = detail?.facltNm ?? site?.faclt_nm ?? ""
  const addr = detail?.addr1 ?? site?.addr1 ?? ""
  const addr2 = detail?.addr2 ?? site?.addr2
  const tel = detail?.tel ?? site?.tel
  const homepage = detail?.homepage ?? site?.homepage
  const intro = detail?.intro
  const lineIntro = detail?.lineIntro ?? site?.line_intro
  const induty = detail?.induty ?? site?.induty
  const sbrsCl = detail?.sbrsCl ?? site?.sbrs_cl
  const animalCmgCl = detail?.animalCmgCl ?? site?.animal_cmg_cl
  const ratingAvg = site?.rating_avg ?? 0
  const ratingCount = site?.rating_count ?? 0

  const lat = detail?.mapY ? Number(detail.mapY) : site?.mapy ?? null
  const lng = detail?.mapX ? Number(detail.mapX) : site?.mapx ?? null

  const galleryImages = images.map((img) => ({
    url: img.imageUrl,
    alt: name,
  }))

  const coverImage = detail?.firstImageUrl ?? site?.first_image_url
  if (coverImage && galleryImages.length === 0) {
    galleryImages.push({ url: coverImage, alt: name })
  }

  const sbrsItems = sbrsCl
    ? sbrsCl
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : []

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      {/* 이미지 갤러리 */}
      {galleryImages.length > 0 && <ImageGallery images={galleryImages} />}

      {/* 기본 정보 */}
      <div className="mt-6">
        <div className="flex flex-wrap items-start gap-3">
          <h1 className="text-2xl font-bold text-foreground">{name}</h1>
          {induty && (
            <Badge variant="secondary" className="mt-1">
              {induty}
            </Badge>
          )}
        </div>

        {lineIntro && (
          <p className="mt-2 text-base text-muted-foreground">{lineIntro}</p>
        )}

        {/* 평점 */}
        <div className="mt-3 flex items-center gap-2">
          <Rating value={ratingAvg} size="md" showValue readonly />
          <span className="text-sm text-muted-foreground">({ratingCount}개 리뷰)</span>
        </div>
      </div>

      <Separator className="my-6" />

      {/* 상세 정보 */}
      <section className="flex flex-col gap-3 text-sm">
        <div className="flex gap-2">
          <span className="w-20 shrink-0 font-medium text-foreground">주소</span>
          <span className="text-muted-foreground">
            {addr}
            {addr2 ? ` ${addr2}` : ""}
          </span>
        </div>

        {tel && (
          <div className="flex gap-2">
            <span className="w-20 shrink-0 font-medium text-foreground">전화</span>
            <a href={`tel:${tel}`} className="text-primary hover:underline">
              {tel}
            </a>
          </div>
        )}

        {homepage && (
          <div className="flex gap-2">
            <span className="w-20 shrink-0 font-medium text-foreground">홈페이지</span>
            <a
              href={homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-primary hover:underline"
            >
              {homepage}
            </a>
          </div>
        )}

        {animalCmgCl && (
          <div className="flex gap-2">
            <span className="w-20 shrink-0 font-medium text-foreground">반려동물</span>
            <span className="text-muted-foreground">{animalCmgCl}</span>
          </div>
        )}
      </section>

      {/* 소개 */}
      {intro && (
        <>
          <Separator className="my-6" />
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">소개</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {intro}
            </p>
          </section>
        </>
      )}

      {/* 부대시설 */}
      {sbrsItems.length > 0 && (
        <>
          <Separator className="my-6" />
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">부대시설</h2>
            <div className="flex flex-wrap gap-2">
              {sbrsItems.map((item) => (
                <Badge key={item} variant="outline">
                  {item}
                </Badge>
              ))}
            </div>
          </section>
        </>
      )}

      {/* 지도 */}
      {lat !== null && lng !== null && (
        <>
          <Separator className="my-6" />
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">위치</h2>
            <CampingMap lat={lat} lng={lng} title={name} />
            <p className="mt-2 text-xs text-muted-foreground">{addr}</p>
          </section>
        </>
      )}
    </main>
  )
}
