"use client"

import { useState } from "react"
import koreaMap from "@/lib/constants/korea-map-data"

// Map from svg-map id → 법정동 area code
const ID_TO_AREA_CODE: Record<string, string> = {
  "seoul": "11",
  "busan": "26",
  "daegu": "27",
  "incheon": "28",
  "gwangju": "29",
  "daejeon": "30",
  "ulsan": "31",
  "gyeonggi": "41",
  "north-chungcheong": "43",
  "south-chungcheong": "44",
  "south-jeolla": "46",
  "north-gyeongsang": "47",
  "south-gyeongsang": "48",
  "jeju": "50",
  "gangwon": "51",
  "north-jeolla": "52",
  "sejong": "36110",
}

// Reverse mapping
const AREA_CODE_TO_ID: Record<string, string> = Object.fromEntries(
  Object.entries(ID_TO_AREA_CODE).map(([id, code]) => [code, id])
)

// Korean labels for each region
const ID_TO_LABEL: Record<string, string> = {
  "seoul": "서울",
  "busan": "부산",
  "daegu": "대구",
  "incheon": "인천",
  "gwangju": "광주",
  "daejeon": "대전",
  "ulsan": "울산",
  "gyeonggi": "경기",
  "north-chungcheong": "충북",
  "south-chungcheong": "충남",
  "south-jeolla": "전남",
  "north-gyeongsang": "경북",
  "south-gyeongsang": "경남",
  "jeju": "제주",
  "gangwon": "강원",
  "north-jeolla": "전북",
  "sejong": "세종",
}

const LABEL_POSITIONS: Record<string, { x: number; y: number } | null> = {
  "seoul": null,
  "busan": null,
  "daegu": null,
  "incheon": null,
  "gwangju": null,
  "daejeon": null,
  "ulsan": null,
  "sejong": null,
  "gyeonggi": { x: 155, y: 115 },
  "gangwon": { x: 350, y: 100 },
  "north-chungcheong": { x: 260, y: 230 },
  "south-chungcheong": { x: 140, y: 280 },
  "north-jeolla": { x: 160, y: 380 },
  "south-jeolla": { x: 130, y: 490 },
  "north-gyeongsang": { x: 370, y: 280 },
  "south-gyeongsang": { x: 320, y: 430 },
  "jeju": { x: 130, y: 590 },
}

interface KoreaMapSvgProps {
  selectedAreaCode?: string
  onAreaClick?: (areaCode: string) => void
  onAreaHover?: (areaCode: string | null) => void
  className?: string
}

export default function KoreaMapSvg({
  selectedAreaCode,
  onAreaClick,
  onAreaHover,
  className,
}: KoreaMapSvgProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const selectedId = selectedAreaCode ? AREA_CODE_TO_ID[selectedAreaCode] : undefined

  return (
    <svg
      viewBox={koreaMap.viewBox}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={koreaMap.label}
    >
      <rect width="100%" height="100%" fill="hsl(200 40% 94%)" rx="8" />
      {koreaMap.locations.map((location) => {
        const { id, path, name } = location
        const isHovered = hoveredId === id
        const isSelected = selectedId === id
        const label = ID_TO_LABEL[id]
        const labelPos = LABEL_POSITIONS[id]

        let fill: string
        let stroke: string
        let strokeWidth: number
        let filter: string

        if (isSelected) {
          fill = "rgba(216,67,21,0.22)"
          stroke = "#B71C1C"
          strokeWidth = 2
          filter = "none"
        } else if (isHovered) {
          fill = "rgba(216,67,21,0.12)"
          stroke = "#D84315"
          strokeWidth = 1.5
          filter = "drop-shadow(0 2px 6px rgba(216,67,21,0.3))"
        } else {
          fill = "#F0ECE4"
          stroke = "#C8C3B8"
          strokeWidth = 0.8
          filter = "none"
        }

        return (
          <g key={id}>
            <path
              d={path}
              role="button"
              aria-label={label ?? name}
              tabIndex={0}
              style={{
                fill,
                stroke,
                strokeWidth,
                filter,
                cursor: "pointer",
                transition: "fill 0.18s cubic-bezier(0.4,0,0.2,1), stroke 0.18s ease, stroke-width 0.18s ease, filter 0.18s ease",
              }}
              onClick={() => {
                const code = ID_TO_AREA_CODE[id]
                if (code) onAreaClick?.(code)
              }}
              onMouseEnter={() => {
                setHoveredId(id)
                const code = ID_TO_AREA_CODE[id]
                if (code) onAreaHover?.(code)
              }}
              onMouseLeave={() => {
                setHoveredId(null)
                onAreaHover?.(null)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  const code = ID_TO_AREA_CODE[id]
                  if (code) onAreaClick?.(code)
                }
              }}
            >
              <title>{label ?? name}</title>
            </path>
            {labelPos && label && (
              <text
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={11}
                fontWeight={600}
                style={{ fill: "#5A413A", pointerEvents: "none", letterSpacing: "0.02em" }}
              >
                {label}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
