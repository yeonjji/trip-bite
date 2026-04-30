"use client"

import { useState } from "react"
import Image from "next/image"

interface Props {
  src: string | null | undefined
  alt: string
  compact?: boolean
  sizes?: string
  priority?: boolean
}

export default function SafeRecipeImage({ src, alt, compact = false, sizes, priority }: Props) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) return null

  if (compact) {
    return (
      <div className="relative mt-3 aspect-video w-full overflow-hidden rounded-xl bg-[#F4F1E9]">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes={sizes ?? "(max-width: 768px) 100vw, 600px"}
          unoptimized
          onError={() => setFailed(true)}
        />
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover"
      sizes={sizes ?? "(max-width: 768px) 100vw, 768px"}
      priority={priority}
      unoptimized
      onError={() => setFailed(true)}
    />
  )
}
