"use client"

import Image from "next/image"
import { useState, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface ImageItem {
  url: string
  alt?: string
}

interface ImageGalleryProps {
  images: ImageItem[]
}

export default function ImageGallery({ images }: ImageGalleryProps) {
  const [index, setIndex] = useState(0)

  const prev = useCallback(() => setIndex((i) => (i - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() => setIndex((i) => (i + 1) % images.length), [images.length])

  if (images.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted">
        <Image
          src={images[index].url}
          alt={images[index].alt ?? ""}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 800px"
          priority
          unoptimized
        />

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="이전 사진"
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              aria-label="다음 사진"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-black/40 px-2.5 py-0.5 text-xs text-white backdrop-blur-sm">
              {index + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setIndex(idx)}
              className={`relative aspect-square overflow-hidden rounded-lg bg-muted transition-opacity ${
                idx === index
                  ? "ring-2 ring-primary ring-offset-2"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={img.url}
                alt={img.alt ?? ""}
                fill
                className="object-cover"
                sizes="120px"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
