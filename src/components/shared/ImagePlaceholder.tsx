"use client"

import Image from "next/image"
import { useState } from "react"

type PlaceholderType = "travel" | "pet" | "barrier-free" | "camping" | "restaurant" | "specialty" | "festival" | "default"

// 카테고리별 대체 이미지 — public/images/placeholders/ 폴더에 넣어주세요
const PLACEHOLDER_IMG: Record<PlaceholderType, string> = {
  travel:         "/images/placeholders/travel.jpg",
  camping:        "/images/placeholders/camping.jpg",
  restaurant:     "/images/placeholders/restaurant.jpg",
  specialty:      "/images/placeholders/specialty.jpg",
  festival:       "/images/placeholders/festival.jpg",
  pet:            "/images/placeholders/pet.jpg",
  "barrier-free": "/images/placeholders/travel.jpg",
  default:        "/images/placeholders/travel.jpg",
}

// 로드 실패 시 그라디언트 폴백
const GRADIENT_FALLBACK: Record<PlaceholderType, string> = {
  travel:         "from-sky-100 to-blue-200",
  camping:        "from-green-100 to-emerald-200",
  restaurant:     "from-orange-100 to-amber-200",
  specialty:      "from-yellow-100 to-orange-200",
  festival:       "from-pink-100 to-rose-200",
  pet:            "from-amber-100 to-orange-200",
  "barrier-free": "from-teal-100 to-cyan-200",
  default:        "from-slate-100 to-slate-200",
}

interface ImagePlaceholderProps {
  type?: PlaceholderType
  contentTypeId?: string
  fullWidth?: boolean
  alt?: string
}

const CONTENT_TYPE_TO_PLACEHOLDER: Record<string, PlaceholderType> = {
  "12": "travel",
  "14": "travel",
  "15": "festival",
  "25": "travel",
  "28": "travel",
  "39": "restaurant",
}

export default function ImagePlaceholder({
  type = "default",
  contentTypeId,
  fullWidth = false,
  alt = "",
}: ImagePlaceholderProps) {
  const [failed, setFailed] = useState(false)

  const resolvedType: PlaceholderType =
    (contentTypeId ? CONTENT_TYPE_TO_PLACEHOLDER[contentTypeId] : undefined) ?? type

  const src = PLACEHOLDER_IMG[resolvedType]
  const gradient = GRADIENT_FALLBACK[resolvedType]

  if (failed) {
    return (
      <div
        className={`bg-gradient-to-br ${gradient} ${
          fullWidth ? "h-48 w-full rounded-xl" : "h-full w-full"
        }`}
      />
    )
  }

  return (
    <div className={fullWidth ? "relative h-48 w-full rounded-xl overflow-hidden" : "relative h-full w-full"}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        onError={() => setFailed(true)}
      />
    </div>
  )
}
