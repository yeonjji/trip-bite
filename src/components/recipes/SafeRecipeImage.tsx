"use client"

import { useState } from "react"
import Image from "next/image"
import { ChefHat } from "lucide-react"

interface Props {
  src: string | null | undefined
  alt: string
  compact?: boolean
  sizes?: string
  priority?: boolean
}

export default function SafeRecipeImage({ src, alt, compact = false, sizes, priority }: Props) {
  const [failed, setFailed] = useState(false)
  const showFallback = !src || failed

  if (compact) {
    if (showFallback) {
      return (
        <div className="flex h-24 items-center justify-center rounded-xl bg-[#F4F1E9]">
          <ChefHat className="h-8 w-8 text-gray-300" />
        </div>
      )
    }
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[#F4F1E9]">
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

  if (showFallback) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400">
        <ChefHat className="h-12 w-12" />
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
