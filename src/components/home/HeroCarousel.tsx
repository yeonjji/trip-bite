"use client"

import Image from "next/image"
import { useState, useEffect, useRef, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

// Unsplash 큐레이션 사진 — 교체하려면 src의 photo-{id} 부분만 바꾸면 됩니다
const SLIDES = [
  {
    src: "https://images.unsplash.com/photo-1601621915196-2621bfb0cd6e?w=1920&q=85&auto=format&fit=crop",
    alt: "서울 야경",
  },
  {
    src: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1920&q=85&auto=format&fit=crop",
    alt: "경복궁",
  },
  {
    src: "https://images.unsplash.com/photo-1570303345338-e1f0eddf4946?w=1920&q=85&auto=format&fit=crop",
    alt: "부산",
  },
  {
    src: "https://images.unsplash.com/photo-1519923041107-17f5f1af3ab6?w=1920&q=85&auto=format&fit=crop",
    alt: "제주도",
  },
  {
    src: "https://images.unsplash.com/photo-1583416750470-965f2d0b07e6?w=1920&q=85&auto=format&fit=crop",
    alt: "한국 전통마을",
  },
]

const INTERVAL = 5000

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchStartX = useRef<number | null>(null)

  const prev = useCallback(() =>
    setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length), [])
  const next = useCallback(() =>
    setCurrent((c) => (c + 1) % SLIDES.length), [])

  useEffect(() => {
    if (paused) return
    const timer = setInterval(next, INTERVAL)
    return () => clearInterval(timer)
  }, [paused, next])

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const delta = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(delta) > 40) delta > 0 ? next() : prev()
    touchStartX.current = null
  }

  return (
    <div
      className="absolute inset-0 overflow-hidden z-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 슬라이드 이미지 */}
      {SLIDES.map((slide, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            className="object-cover"
            priority={i === 0}
            sizes="100vw"
          />
        </div>
      ))}

      {/* 어두운 그라디언트 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/50" />

      {/* 화살표 */}
      <button
        onClick={prev}
        aria-label="이전 슬라이드"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/40"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={next}
        aria-label="다음 슬라이드"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/40"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* 닷 인디케이터 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`${i + 1}번 슬라이드`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current ? "w-6 bg-white" : "w-1.5 bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  )
}
