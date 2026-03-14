"use client"

// P4-06: 한국 17개 시도 SVG 지도 (원+텍스트 단순 표현)

interface RegionPosition {
  cx: number
  cy: number
  label: string
}

const REGION_POSITIONS: Record<string, RegionPosition> = {
  "1":  { cx: 52,  cy: 28,  label: "서울" },
  "2":  { cx: 38,  cy: 30,  label: "인천" },
  "3":  { cx: 52,  cy: 52,  label: "대전" },
  "4":  { cx: 72,  cy: 58,  label: "대구" },
  "5":  { cx: 38,  cy: 70,  label: "광주" },
  "6":  { cx: 80,  cy: 72,  label: "부산" },
  "7":  { cx: 84,  cy: 65,  label: "울산" },
  "8":  { cx: 56,  cy: 46,  label: "세종" },
  "31": { cx: 52,  cy: 36,  label: "경기" },
  "32": { cx: 70,  cy: 22,  label: "강원" },
  "33": { cx: 60,  cy: 50,  label: "충북" },
  "34": { cx: 44,  cy: 54,  label: "충남" },
  "35": { cx: 46,  cy: 66,  label: "전북" },
  "36": { cx: 40,  cy: 78,  label: "전남" },
  "37": { cx: 76,  cy: 46,  label: "경북" },
  "38": { cx: 68,  cy: 68,  label: "경남" },
  "39": { cx: 52,  cy: 92,  label: "제주" },
}

interface KoreaMapSvgProps {
  selectedAreaCode?: string
  onAreaClick?: (code: string) => void
  className?: string
}

export default function KoreaMapSvg({
  selectedAreaCode,
  onAreaClick,
  className,
}: KoreaMapSvgProps) {
  return (
    <svg
      viewBox="0 0 110 110"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="대한민국 지역 지도"
    >
      {/* 한반도 외곽 배경 */}
      <rect
        x="25" y="10" width="70" height="85"
        rx="8"
        style={{ fill: "var(--muted)", stroke: "var(--border)", strokeWidth: 0.5 }}
      />

      {Object.entries(REGION_POSITIONS).map(([code, { cx, cy, label }]) => {
        const isSelected = selectedAreaCode === code
        return (
          <g
            key={code}
            onClick={() => onAreaClick?.(code)}
            style={{ cursor: onAreaClick ? "pointer" : "default" }}
            role={onAreaClick ? "button" : undefined}
            aria-label={label}
            aria-pressed={isSelected}
          >
            <circle
              cx={cx}
              cy={cy}
              r={isSelected ? 7 : 5.5}
              style={{
                fill: isSelected ? "var(--primary)" : "var(--background)",
                stroke: isSelected ? "var(--primary)" : "var(--border)",
                strokeWidth: isSelected ? 1.5 : 1,
              }}
            />
            <text
              x={cx}
              y={cy + 0.5}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={isSelected ? "3.5" : "3"}
              fontWeight={isSelected ? "700" : "400"}
              style={{ fill: isSelected ? "var(--primary-foreground)" : "var(--foreground)" }}
            >
              {label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
