"use client"

import { useState } from "react"
import Link from "next/link"
import KoreaMapSvg from "@/components/maps/KoreaMapSvg"
import { AREA_CODES } from "@/lib/constants/area-codes"

const FEATURED_AREA_CODES = ["11", "41", "51", "26", "50", "46", "47", "48"]

interface RegionExplorerProps {
  locale: string
}

export default function RegionExplorer({ locale }: RegionExplorerProps) {
  const [hoveredCode, setHoveredCode] = useState<string | null>(null)

  return (
    <section className="bg-muted/30 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-6 text-xl font-semibold text-foreground">
          {locale === "en" ? "Explore by Region" : "지역별 탐색"}
        </h2>
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="mx-auto w-60 flex-none md:mx-0 md:w-64">
            <KoreaMapSvg
              className="h-auto w-full"
              selectedAreaCode={hoveredCode ?? undefined}
              onAreaClick={(code) => {
                window.location.href = `/${locale}/travel?areaCode=${code}`
              }}
              onAreaHover={setHoveredCode}
            />
          </div>
          <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
            {FEATURED_AREA_CODES.map((code) => {
              const area = AREA_CODES.find((a) => a.code === code)
              if (!area) return null
              const name = locale === "en" ? area.nameEn : area.nameKo
              const isHovered = hoveredCode === code
              return (
                <Link
                  key={code}
                  href={`/${locale}/travel?areaCode=${code}`}
                  className={`flex items-center justify-center rounded-lg border bg-background p-4 text-center font-medium transition-all duration-200 ${
                    isHovered
                      ? "border-primary bg-primary/5 text-primary shadow-md scale-[1.02]"
                      : "border-border text-foreground hover:border-primary hover:bg-primary/5 hover:text-primary"
                  }`}
                  onMouseEnter={() => setHoveredCode(code)}
                  onMouseLeave={() => setHoveredCode(null)}
                >
                  {name}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
