"use client"

import { useState } from "react"
import Link from "next/link"
import KoreaMapSvg from "@/components/maps/KoreaMapSvg"
import { AREA_CODES } from "@/lib/constants/area-codes"

const FEATURED_AREA_CODES = ["11", "41", "51", "26", "50", "52", "46", "48"]

const REGION_META: Record<string, { icon: string; tagline: string; taglineEn: string }> = {
  "11": { icon: "🏙️", tagline: "도심 속 문화",   taglineEn: "Urban culture" },
  "41": { icon: "🌸", tagline: "역사와 자연",     taglineEn: "History & nature" },
  "51": { icon: "🏔️", tagline: "설악산 & 바다",  taglineEn: "Mountains & sea" },
  "26": { icon: "🐟", tagline: "해산물의 도시",   taglineEn: "Seafood city" },
  "50": { icon: "🌊", tagline: "섬의 낙원",       taglineEn: "Island paradise" },
  "52": { icon: "🌾", tagline: "전통과 맛",       taglineEn: "Tradition & taste" },
  "46": { icon: "🍵", tagline: "녹차와 힐링",     taglineEn: "Tea & healing" },
  "48": { icon: "⛵", tagline: "남해의 보석",     taglineEn: "Southern gem" },
}

interface RegionExplorerProps {
  locale: string
}

export default function RegionExplorer({ locale }: RegionExplorerProps) {
  const [hoveredCode, setHoveredCode] = useState<string | null>(null)

  const hoveredArea = AREA_CODES.find((a) => a.code === hoveredCode)
  const tooltipName = hoveredArea ? (locale === "en" ? hoveredArea.nameEn : hoveredArea.nameKo) : null

  return (
    <section
      className="relative overflow-hidden px-6 py-16 md:py-20"
      style={{ background: "linear-gradient(145deg, #F9F7EF 0%, #FFFDF5 40%, #FFEDE7 75%, #F9F7EF 100%)" }}
    >
      {/* Dot grid texture */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.035]"
        style={{
          backgroundImage: "radial-gradient(circle, #5A413A 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      {/* Warm glow top-right */}
      <div
        className="pointer-events-none absolute -top-32 -right-32 z-0 h-96 w-96 rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #ffac90 0%, transparent 70%)" }}
      />

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Heading */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#2D1F1A] md:text-3xl">
            {locale === "en" ? "Explore by Region" : "지역별 탐색"}
          </h2>
          <p className="mt-1 text-sm text-[#7A5C52]">
            {locale === "en" ? "Discover Korea's diverse destinations" : "한국의 다양한 여행지를 탐험하세요"}
          </p>
          <div className="mt-3 h-1 w-10 rounded-full bg-primary" />
        </div>

        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          {/* Map container */}
          <div className="relative mx-auto flex-none md:mx-0" style={{ width: "280px" }}>
            {/* Outer glow */}
            <div
              className="absolute -inset-2 rounded-3xl opacity-30"
              style={{ background: "radial-gradient(ellipse at center, #ffac90 0%, transparent 70%)" }}
            />
            {/* Glass card */}
            <div
              className="relative rounded-2xl border border-white/60 bg-white/70 p-4 backdrop-blur-sm"
              style={{ boxShadow: "0 20px 60px rgba(87,45,32,0.12), 0 4px 16px rgba(87,45,32,0.06)" }}
            >
              <KoreaMapSvg
                className="h-auto w-full"
                selectedAreaCode={hoveredCode ?? undefined}
                onAreaClick={(code) => {
                  window.location.href = `/${locale}/travel?areaCode=${code}`
                }}
                onAreaHover={setHoveredCode}
              />
              {/* Tooltip pill */}
              <div
                className={`absolute bottom-3 left-1/2 z-10 -translate-x-1/2 transition-all duration-200 ${
                  tooltipName ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-1 opacity-0"
                }`}
              >
                <div className="whitespace-nowrap rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white shadow-lg">
                  {tooltipName ?? ""}
                </div>
              </div>
            </div>
          </div>

          {/* Region cards */}
          <div className="flex flex-1 flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {FEATURED_AREA_CODES.map((code) => {
                const area = AREA_CODES.find((a) => a.code === code)
                if (!area) return null
                const name = locale === "en" ? area.nameEn : area.nameKo
                const isHovered = hoveredCode === code
                const meta = REGION_META[code] ?? { icon: "📍", tagline: "탐험하기", taglineEn: "Explore" }

                return (
                  <Link
                    key={code}
                    href={`/${locale}/travel?areaCode=${code}`}
                    className="group relative flex flex-col gap-1 overflow-hidden rounded-xl border px-4 py-3 text-left transition-all duration-300 ease-out"
                    style={
                      isHovered
                        ? {
                            background: "linear-gradient(135deg,#fff5f0,#fffdf5)",
                            boxShadow: "0 12px 32px rgba(216,67,21,0.12)",
                            borderColor: "rgba(216,67,21,0.3)",
                          }
                        : {
                            background: "linear-gradient(135deg,#ffffff,#fafaf8)",
                            borderColor: "rgba(0,0,0,0.08)",
                          }
                    }
                    onMouseEnter={() => setHoveredCode(code)}
                    onMouseLeave={() => setHoveredCode(null)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#2D1F1A]">{name}</span>
                      <span
                        className={`text-primary transition-all duration-200 ${
                          isHovered ? "opacity-100" : "-translate-x-1 opacity-0"
                        }`}
                      >
                        →
                      </span>
                    </div>
                    <span className="text-[10px] text-[#7A5C52]/70">
                      {locale === "en" ? meta.taglineEn : meta.tagline}
                    </span>
                  </Link>
                )
              })}
            </div>

            {/* All regions link */}
            <div className="text-right">
              <Link
                href={`/${locale}/travel`}
                className="text-sm font-medium text-[#7A5C52] underline-offset-4 hover:text-primary hover:underline transition-colors duration-200"
              >
                {locale === "en" ? "View all regions →" : "모든 지역 보기 →"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
