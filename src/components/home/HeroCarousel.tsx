"use client"

import Image from "next/image"
import { useState, useEffect, useCallback } from "react"

const SLIDES = [
  { src: "/hero/bongki66-gyeongbokgung-6200276_1920.webp", alt: "경복궁" },
  { src: "/hero/markus-winkler-n-E0XNnGc-Q-unsplash.webp", alt: "한국 여행" },
  { src: "/hero/huongnguyen123-korea-7366036_1920.webp", alt: "한국 풍경" },
  { src: "/hero/jakub-kapusnak-4f4YZfDMLeU-unsplash.webp", alt: "한국 음식" },
  { src: "/hero/hc-digital-W4qdDbv8QUM-unsplash.webp", alt: "한국 여행" },
]

const INTERVAL = 4000

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0)

  const next = useCallback(() =>
    setCurrent((c) => (c + 1) % SLIDES.length), [])

  useEffect(() => {
    const timer = setInterval(next, INTERVAL)
    return () => clearInterval(timer)
  }, [next])

  return (
    <div className="absolute inset-0 overflow-hidden z-0">
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
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/50" />
    </div>
  )
}
