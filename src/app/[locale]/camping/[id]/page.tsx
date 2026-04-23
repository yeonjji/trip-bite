import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"

import ImageGallery from "@/components/shared/ImageGallery"
import { buildAlternates } from "@/lib/utils/metadata"
import Rating from "@/components/shared/Rating"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getCampingSiteDetail } from "@/lib/data/camping"
import { getNearbyFacilities } from "@/lib/data/nearby-facilities"
import { buildNaverMapUrl } from "@/lib/api/kakao-api"
import WeatherWidget from "@/components/weather/WeatherWidget"
import ReviewSection from "@/components/reviews/ReviewSection"

import CampingMap from "./_components/CampingMap"
import NearbyFacilities from "../../travel/_components/NearbyFacilities"

interface PageProps {
  params: Promise<{ locale: string; id: string }>
}

function doNmToAreaCode(doNm: string): string {
  if (doNm.includes("서울")) return "11"
  if (doNm.includes("부산")) return "26"
  if (doNm.includes("대구")) return "27"
  if (doNm.includes("인천")) return "28"
  if (doNm.includes("광주")) return "29"
  if (doNm.includes("대전")) return "30"
  if (doNm.includes("울산")) return "31"
  if (doNm.includes("세종")) return "36"
  if (doNm.includes("경기")) return "41"
  if (doNm.includes("강원")) return "42"
  if (doNm.includes("충북") || doNm.includes("충청북")) return "43"
  if (doNm.includes("충남") || doNm.includes("충청남")) return "44"
  if (doNm.includes("전북") || doNm.includes("전라북")) return "45"
  if (doNm.includes("전남") || doNm.includes("전라남")) return "46"
  if (doNm.includes("경북") || doNm.includes("경상북")) return "47"
  if (doNm.includes("경남") || doNm.includes("경상남")) return "48"
  if (doNm.includes("제주")) return "50"
  return "11"
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
  const { locale, id } = await params
  setRequestLocale(locale)

  const { site, detail, images } = await getCampingSiteDetail(id)

  if (!site && !detail) notFound()

  const isKo = locale === "ko"

  const name = detail?.facltNm ?? site?.faclt_nm ?? ""
  const addr = detail?.addr1 ?? site?.addr1 ?? ""
  const addr2 = detail?.addr2 ?? site?.addr2
  const tel = detail?.tel ?? site?.tel
  const homepage = detail?.homepage ?? site?.homepage
  const intro = detail?.intro
  const lineIntro = detail?.lineIntro ?? site?.line_intro
  const induty = detail?.induty ?? site?.induty
  const sbrsCl = detail?.sbrsCl ?? site?.sbrs_cl
  const sbrsEtc = detail?.sbrsEtc
  const animalCmgCl = detail?.animalCmgCl ?? site?.animal_cmg_cl
  const ratingAvg = site?.rating_avg ?? 0
  const ratingCount = site?.rating_count ?? 0
  const doNm = detail?.doNm ?? site?.do_nm ?? ""

  const gnrlSiteCo = detail?.gnrlSiteCo ?? site?.gnrl_site_co
  const autoSiteCo = detail?.autoSiteCo ?? site?.auto_site_co
  const glampSiteCo = detail?.glampSiteCo ?? site?.glamp_site_co
  const caravSiteCo = detail?.caravSiteCo ?? site?.carav_site_co

  const siteBottomCl1 = detail?.siteBottomCl1 ?? site?.site_bottom_cl1
  const siteBottomCl2 = detail?.siteBottomCl2 ?? site?.site_bottom_cl2
  const siteBottomCl3 = detail?.siteBottomCl3 ?? site?.site_bottom_cl3
  const siteBottomCl4 = detail?.siteBottomCl4 ?? site?.site_bottom_cl4
  const siteBottomCl5 = detail?.siteBottomCl5 ?? site?.site_bottom_cl5

  const toiletCo = detail?.toiletCo
  const swrmCo = detail?.swrmCo
  const wtrplCo = detail?.wtrplCo

  const operPdCl = detail?.operPdCl
  const operDeCl = detail?.operDeCl
  const brazierCl = detail?.brazierCl ?? site?.brazier_cl
  const resveCl = detail?.resveCl
  const resveUrl = detail?.resveUrl
  const lctCl = detail?.lctCl
  const themaEnvrnCl = detail?.themaEnvrnCl

  const lat = detail?.mapY ? Number(detail.mapY) : site?.mapy ?? null
  const lng = detail?.mapX ? Number(detail.mapX) : site?.mapx ?? null
  const hasMap = lat !== null && lng !== null

  const nearbyFacilities =
    hasMap && !isNaN(lat!) && !isNaN(lng!)
      ? await getNearbyFacilities(lat!, lng!)
      : { toilets: [], wifi: [], parking: [], evStations: [] }

  const galleryImages = images.map((img) => ({ url: img.imageUrl, alt: name }))
  const coverImage = detail?.firstImageUrl ?? site?.first_image_url
  if (coverImage && galleryImages.length === 0) {
    galleryImages.push({ url: coverImage, alt: name })
  }

  const sbrsItems = sbrsCl
    ? sbrsCl.split(",").map((s) => s.trim()).filter(Boolean)
    : []

  const floorTypes: string[] = []
  if (siteBottomCl1) floorTypes.push(isKo ? "잔디" : "Grass")
  if (siteBottomCl2) floorTypes.push(isKo ? "파쇄석" : "Gravel")
  if (siteBottomCl3) floorTypes.push(isKo ? "데크" : "Deck")
  if (siteBottomCl4) floorTypes.push(isKo ? "자갈" : "Pebble")
  if (siteBottomCl5) floorTypes.push(isKo ? "맨흙" : "Bare Soil")

  const lctItems = lctCl ? lctCl.split(",").map((s) => s.trim()).filter(Boolean) : []
  const themaItems = themaEnvrnCl ? themaEnvrnCl.split(",").map((s) => s.trim()).filter(Boolean) : []

  const hasSiteInfo =
    (gnrlSiteCo != null && gnrlSiteCo > 0) ||
    (autoSiteCo != null && autoSiteCo > 0) ||
    (glampSiteCo != null && glampSiteCo > 0) ||
    (caravSiteCo != null && caravSiteCo > 0) ||
    floorTypes.length > 0

  const hasFacilities = toiletCo != null || swrmCo != null || wtrplCo != null

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      {/* 이미지 갤러리 */}
      {galleryImages.length > 0 && (
        <ImageGallery images={galleryImages} />
      )}

      {/* 기본 정보 */}
      <div className="mt-6">
        <div className="flex flex-wrap items-start gap-3">
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-[#1B1C1A] md:text-4xl">
            {name}
          </h1>
          {induty && (
            <Badge variant="secondary" className="mt-1">
              {induty}
            </Badge>
          )}
        </div>

        {lineIntro && (
          <p className="mt-2 text-base text-muted-foreground">{lineIntro}</p>
        )}

        <div className="mt-3 flex items-center gap-2">
          <Rating value={ratingAvg} size="md" showValue readonly />
          <span className="text-sm text-muted-foreground">
            ({ratingCount}{isKo ? "개 리뷰" : " reviews"})
          </span>
        </div>
      </div>

      <Separator className="my-6" />

      {/* 상세 정보 카드 */}
      <section className="space-y-3 rounded-xl bg-[#F9F7EF] p-4 soft-card-shadow">
        <div className="flex gap-2 text-sm">
          <span className="w-24 shrink-0 font-medium text-muted-foreground">
            {isKo ? "주소" : "Address"}
          </span>
          <span className="text-foreground">
            {addr}{addr2 ? ` ${addr2}` : ""}
          </span>
        </div>

        {tel && (
          <div className="flex gap-2 text-sm">
            <span className="w-24 shrink-0 font-medium text-muted-foreground">
              {isKo ? "전화" : "Phone"}
            </span>
            <a href={`tel:${tel}`} className="text-[#D84315] hover:underline">
              {tel}
            </a>
          </div>
        )}

        {homepage && (
          <div className="flex gap-2 text-sm">
            <span className="w-24 shrink-0 font-medium text-muted-foreground">
              {isKo ? "홈페이지" : "Website"}
            </span>
            <a
              href={homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-[#D84315] hover:underline"
            >
              {homepage}
            </a>
          </div>
        )}

        {animalCmgCl && (
          <div className="flex gap-2 text-sm">
            <span className="w-24 shrink-0 font-medium text-muted-foreground">
              {isKo ? "반려동물" : "Pets"}
            </span>
            <span className="text-foreground">{animalCmgCl}</span>
          </div>
        )}

        {brazierCl && (
          <div className="flex gap-2 text-sm">
            <span className="w-24 shrink-0 font-medium text-muted-foreground">
              {isKo ? "화로대" : "Brazier"}
            </span>
            <span className="text-foreground">{brazierCl}</span>
          </div>
        )}

        {operPdCl && (
          <div className="flex gap-2 text-sm">
            <span className="w-24 shrink-0 font-medium text-muted-foreground">
              {isKo ? "운영기간" : "Season"}
            </span>
            <span className="text-foreground">{operPdCl}</span>
          </div>
        )}

        {operDeCl && (
          <div className="flex gap-2 text-sm">
            <span className="w-24 shrink-0 font-medium text-muted-foreground">
              {isKo ? "운영일자" : "Open Days"}
            </span>
            <span className="text-foreground">{operDeCl}</span>
          </div>
        )}

        {resveCl && (
          <div className="flex gap-2 text-sm">
            <span className="w-24 shrink-0 font-medium text-muted-foreground">
              {isKo ? "예약방법" : "Reservation"}
            </span>
            <span className="text-foreground">{resveCl}</span>
          </div>
        )}
      </section>

      {/* 예약 버튼 */}
      {resveUrl && (
        <div className="mt-4">
          <a
            href={resveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-[#D84315] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#B71C1C] transition-colors"
          >
            {isKo ? "예약하기" : "Reserve Now"}
          </a>
        </div>
      )}

      {/* 사이트 정보 */}
      {hasSiteInfo && (
        <>
          <Separator className="my-6" />
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              {isKo ? "사이트 정보" : "Site Info"}
            </h2>
            <div className="rounded-xl bg-[#F9F7EF] p-4 soft-card-shadow space-y-3">
              {gnrlSiteCo != null && gnrlSiteCo > 0 && (
                <div className="flex gap-2 text-sm">
                  <span className="w-28 shrink-0 font-medium text-muted-foreground">
                    {isKo ? "일반 사이트" : "Standard"}
                  </span>
                  <span className="text-foreground">{gnrlSiteCo}{isKo ? "개" : " sites"}</span>
                </div>
              )}
              {autoSiteCo != null && autoSiteCo > 0 && (
                <div className="flex gap-2 text-sm">
                  <span className="w-28 shrink-0 font-medium text-muted-foreground">
                    {isKo ? "자동차 사이트" : "Car Camping"}
                  </span>
                  <span className="text-foreground">{autoSiteCo}{isKo ? "개" : " sites"}</span>
                </div>
              )}
              {glampSiteCo != null && glampSiteCo > 0 && (
                <div className="flex gap-2 text-sm">
                  <span className="w-28 shrink-0 font-medium text-muted-foreground">
                    {isKo ? "글램핑" : "Glamping"}
                  </span>
                  <span className="text-foreground">{glampSiteCo}{isKo ? "개" : " sites"}</span>
                </div>
              )}
              {caravSiteCo != null && caravSiteCo > 0 && (
                <div className="flex gap-2 text-sm">
                  <span className="w-28 shrink-0 font-medium text-muted-foreground">
                    {isKo ? "카라반" : "Caravan"}
                  </span>
                  <span className="text-foreground">{caravSiteCo}{isKo ? "개" : " sites"}</span>
                </div>
              )}
              {floorTypes.length > 0 && (
                <div className="flex gap-2 text-sm">
                  <span className="w-28 shrink-0 font-medium text-muted-foreground">
                    {isKo ? "바닥 재질" : "Ground Type"}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {floorTypes.map((f) => (
                      <Badge key={f} variant="outline" className="text-xs">
                        {f}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {/* 편의시설 */}
      {hasFacilities && (
        <>
          <Separator className="my-6" />
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              {isKo ? "편의시설" : "Facilities"}
            </h2>
            <div className="flex flex-wrap gap-4">
              {toiletCo != null && (
                <div className="flex flex-col items-center gap-1 rounded-xl bg-[#F9F7EF] px-6 py-4 text-center soft-card-shadow">
                  <span className="text-2xl">🚽</span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {isKo ? "화장실" : "Toilets"}
                  </span>
                  <span className="text-lg font-bold text-[#D84315]">{toiletCo}</span>
                </div>
              )}
              {swrmCo != null && (
                <div className="flex flex-col items-center gap-1 rounded-xl bg-[#F9F7EF] px-6 py-4 text-center soft-card-shadow">
                  <span className="text-2xl">🚿</span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {isKo ? "샤워실" : "Showers"}
                  </span>
                  <span className="text-lg font-bold text-[#D84315]">{swrmCo}</span>
                </div>
              )}
              {wtrplCo != null && (
                <div className="flex flex-col items-center gap-1 rounded-xl bg-[#F9F7EF] px-6 py-4 text-center soft-card-shadow">
                  <span className="text-2xl">🚰</span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {isKo ? "개수대" : "Sinks"}
                  </span>
                  <span className="text-lg font-bold text-[#D84315]">{wtrplCo}</span>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {/* 소개 */}
      {intro && (
        <>
          <Separator className="my-6" />
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              {isKo ? "소개" : "About"}
            </h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {intro}
            </p>
          </section>
        </>
      )}

      {/* 부대시설 */}
      {(sbrsItems.length > 0 || sbrsEtc) && (
        <>
          <Separator className="my-6" />
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              {isKo ? "부대시설" : "Amenities"}
            </h2>
            <div className="flex flex-wrap gap-2">
              {sbrsItems.map((item) => (
                <Badge key={item} variant="outline">
                  {item}
                </Badge>
              ))}
              {sbrsEtc && <Badge variant="outline">{sbrsEtc}</Badge>}
            </div>
          </section>
        </>
      )}

      {/* 입지 / 테마 */}
      {(lctItems.length > 0 || themaItems.length > 0) && (
        <>
          <Separator className="my-6" />
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              {isKo ? "입지 / 테마" : "Environment"}
            </h2>
            <div className="flex flex-wrap gap-2">
              {lctItems.map((item) => (
                <Badge key={item} className="bg-sky-100 text-sky-800 hover:bg-sky-100">
                  {item}
                </Badge>
              ))}
              {themaItems.map((item) => (
                <Badge key={item} className="bg-green-100 text-green-800 hover:bg-green-100">
                  {item}
                </Badge>
              ))}
            </div>
          </section>
        </>
      )}

      {/* 지도 */}
      {hasMap && (
        <>
          <Separator className="my-6" />
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              {isKo ? "위치" : "Location"}
            </h2>
            <div className="mb-3">
              <a
                href={buildNaverMapUrl(name, Number(lat), Number(lng))}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#D84315] px-4 py-2 text-sm font-medium text-white hover:bg-[#B71C1C] transition-colors"
              >
                {isKo ? "네이버 지도 보기" : "Naver Map"}
              </a>
            </div>
            <CampingMap lat={Number(lat)} lng={Number(lng)} title={name} />
            <p className="mt-2 text-xs text-muted-foreground">{addr}</p>
          </section>
        </>
      )}

      {/* 날씨 */}
      {doNm && (
        <>
          <Separator className="my-6" />
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              {isKo ? "현지 날씨" : "Local Weather"}
            </h2>
            <WeatherWidget areaCode={doNmToAreaCode(doNm)} locale={locale} />
          </section>
        </>
      )}

      {/* 주변 시설 */}
      <Separator className="my-6" />
      <NearbyFacilities
        locale={locale}
        toilets={nearbyFacilities.toilets}
        wifi={nearbyFacilities.wifi}
        parking={nearbyFacilities.parking}
        evStations={nearbyFacilities.evStations}
      />

      {/* 리뷰 */}
      <Separator className="my-6" />
      <ReviewSection targetType="camping" targetId={id} />
    </main>
  )
}
