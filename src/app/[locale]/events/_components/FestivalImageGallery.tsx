"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface Props {
  images: string[]
  title: string
}

export default function FestivalImageGallery({ images, title }: Props) {
  const [current, setCurrent] = useState(0)
  const touchStartX = useRef<number | null>(null)

  if (images.length === 0) return null

  if (images.length === 1) {
    return (
      <div className="mb-6 overflow-hidden rounded-2xl">
        <div className="relative aspect-video w-full">
          <Image
            src={images[0]}
            alt={title}
            fill
            priority
            sizes="(max-width: 896px) 100vw, 896px"
            className="object-cover"
          />
        </div>
      </div>
    )
  }

  const prev = () => setCurrent((p) => (p - 1 + images.length) % images.length)
  const next = () => setCurrent((p) => (p + 1) % images.length)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev()
    touchStartX.current = null
  }

  return (
    <div className="mb-6 overflow-hidden rounded-2xl">
      <div
        className="relative aspect-video w-full select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={images[current]}
          alt={`${title} ${current + 1}`}
          fill
          priority={current === 0}
          sizes="(max-width: 896px) 100vw, 896px"
          className="object-cover transition-opacity duration-300"
        />

        {/* Gradient overlay at bottom */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Prev button */}
        <button
          onClick={prev}
          aria-label="이전 이미지"
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm transition hover:bg-black/60"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Next button */}
        <button
          onClick={next}
          aria-label="다음 이미지"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm transition hover:bg-black/60"
        >
          <ChevronRight size={20} />
        </button>

        {/* Counter badge */}
        <div className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-0.5 text-xs text-white backdrop-blur-sm">
          {current + 1} / {images.length}
        </div>

        {/* Dot indicators */}
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`이미지 ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === current ? "w-5 bg-white" : "w-1.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
