"use client"

import { useEffect, useState } from "react"
import { Images } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface NaverImage {
  link: string
  thumbnail: string
  sizewidth: string
  sizeheight: string
}

interface Props {
  placeName: string
  regionName?: string | null
}

export default function RelatedImageSearchSection({ placeName, regionName }: Props) {
  const [images, setImages] = useState<NaverImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const query = regionName
    ? `${regionName} ${placeName} 풍경`
    : `${placeName} 여행`

  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true)
      setError(false)
      try {
        const res = await fetch(`/api/naver/image?query=${encodeURIComponent(query)}&display=9`)
        if (!res.ok) throw new Error()
        const data = await res.json()
        setImages(data.items ?? [])
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchImages()
  }, [query])

  return (
    <div className="mb-6">
      <div className="mb-4">
        <h2 className="font-headline text-xl font-bold text-[#1B1C1A]">
          관련 이미지 더보기
        </h2>
        <p className="mt-1 text-sm text-gray-400">
          네이버 이미지 검색 결과를 통해 관련 이미지를 확인할 수 있습니다.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3] w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <p className="py-6 text-center text-sm text-gray-400">
          이미지를 불러오지 못했습니다.
        </p>
      ) : images.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">
          관련 이미지가 없습니다.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {images.map((img, i) => (
              <a
                key={i}
                href={img.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block aspect-[4/3] overflow-hidden rounded-xl bg-gray-100"
              >
                <img
                  src={img.thumbnail}
                  alt={`${placeName} 관련 이미지 ${i + 1}`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
              </a>
            ))}
          </div>
          <p className="mt-2 flex items-center gap-1 text-xs text-gray-400">
            <Images className="h-3 w-3" />
            검색어: &quot;{query}&quot; — 네이버 이미지 검색 결과
          </p>
        </>
      )}
    </div>
  )
}
