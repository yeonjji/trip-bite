"use client"

import Image from "next/image"
import { useState } from "react"

interface Props {
  src: string
  alt: string
  placeholder: string
}

export default function SafeThumbnail({ src, alt, placeholder }: Props) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className="flex h-full items-center justify-center text-2xl">
        {placeholder}
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover transition-transform duration-300 group-hover:scale-105"
      sizes="140px"
      unoptimized
      onError={() => setFailed(true)}
    />
  )
}
