"use client"

import Image from "next/image"

const IMG_W = 720
const GAP = 0

interface HeroSlideshowProps {
  images: string[]
}

export default function HeroSlideshow({ images }: HeroSlideshowProps) {
  if (images.length === 0) return null

  // 최소 4000px 이상 확보하여 어떤 화면에서도 빈 배경이 보이지 않도록 반복
  const minTotalWidth = 4000
  const repeatCount = Math.max(2, Math.ceil(minTotalWidth / (images.length * IMG_W)))
  const evenRepeat = repeatCount % 2 === 0 ? repeatCount : repeatCount + 1
  const repeated = Array.from({ length: evenRepeat }, () => images).flat()

  return (
    <div
      className="absolute inset-0 overflow-hidden z-0"
      style={{ maskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)" }}
    >
      <div
        className="flex h-full"
        style={{
          width: `${repeated.length * IMG_W}px`,
          animation: "marquee-left 120s linear infinite",
        }}
      >
        {repeated.map((src, i) => (
          <div
            key={i}
            className="relative h-full flex-shrink-0 opacity-50"
            style={{ width: IMG_W }}
          >
            <Image
              src={src}
              alt=""
              fill
              className="object-cover"
              unoptimized
              loading="eager"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
