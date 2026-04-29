// P2-10: 특산품 상세 페이지

import Image from "next/image"
import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import type { Metadata } from "next"

import { Badge } from "@/components/ui/badge"
import { getSpecialtyDetail } from "@/lib/data/specialties"
import { buildAlternates } from "@/lib/utils/metadata"
import TravelBlogReviewSection from "@/components/travel/TravelBlogReviewSection"

type Props = {
  params: Promise<{ locale: string; id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { specialty } = await getSpecialtyDetail(id)

  const title = specialty?.name_ko ?? "특산품 상세"
  const description = specialty?.description ?? ""
  const ogImage = specialty?.image_url

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    alternates: buildAlternates(`/specialties/${id}`),
  }
}

export default async function SpecialtyDetailPage({ params }: Props) {
  const { locale, id } = await params

  setRequestLocale(locale)

  const { specialty } = await getSpecialtyDetail(id)

  if (!specialty) {
    notFound()
  }

  const isKo = locale === "ko"
  const displayName = isKo || !specialty.name_en ? specialty.name_ko : specialty.name_en
  const regionName = isKo
    ? specialty.regions?.name_ko
    : specialty.regions?.name_en

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-foreground">{displayName}</h1>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{specialty.category}</Badge>
        {specialty.season.map((s) => (
          <Badge key={s} variant="outline">
            {s}
          </Badge>
        ))}
        {regionName && (
          <span className="text-sm text-primary">{regionName}</span>
        )}
      </div>

      {specialty.image_url && (
        <div className="relative mb-6 aspect-video w-full overflow-hidden rounded-xl bg-muted">
          <Image
            src={specialty.image_url}
            alt={displayName}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 896px"
            priority
          />
        </div>
      )}

      {specialty.description && (
        <div className="mb-6">
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            {isKo ? "소개" : "About"}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {specialty.description}
          </p>
        </div>
      )}

      {specialty.tags && specialty.tags.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            {isKo ? "태그" : "Tags"}
          </h2>
          <div className="flex flex-wrap gap-2">
            {specialty.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* 여행 후기 */}
      <TravelBlogReviewSection
        placeName={specialty.name_ko}
        regionName={specialty.regions?.name_ko ?? null}
      />
    </div>
  )
}
