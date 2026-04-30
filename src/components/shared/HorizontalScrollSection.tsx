import Link from "next/link"
import Image from "next/image"
import { ChevronRight, ArrowRight } from "lucide-react"

export interface ScrollItem {
  href: string
  imageUrl?: string | null
  imagePlaceholder?: string
  tag?: string | null
  title: string
  sub?: string | null
}

interface Props {
  title: string
  sub?: string
  items: ScrollItem[]
  moreHref?: string
  moreLabel?: string
}

export default function HorizontalScrollSection({ title, sub, items, moreHref, moreLabel }: Props) {
  if (items.length === 0) return null

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="font-headline text-xl font-bold text-[#1B1C1A]">{title}</h2>
          {sub && <p className="mt-0.5 text-sm text-gray-400">{sub}</p>}
        </div>
        {moreHref && (
          <Link
            href={moreHref}
            className="flex shrink-0 items-center gap-1 text-sm font-medium text-[#D84315] hover:underline"
          >
            {moreLabel ?? "더보기"} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* 가로 스크롤 */}
      <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex w-[140px] shrink-0 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
          >
            {/* 정사각형 썸네일 */}
            <div className="relative aspect-square w-full overflow-hidden bg-[#F4F1E9]">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="140px"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center text-2xl">
                  {item.imagePlaceholder ?? "📍"}
                </div>
              )}
            </div>

            {/* 텍스트 */}
            <div className="flex flex-1 flex-col justify-between p-2.5">
              <div>
                {item.tag && (
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#D84315]">
                    {item.tag}
                  </p>
                )}
                <p className="mt-0.5 line-clamp-2 text-sm font-bold leading-snug text-[#1B1C1A]">
                  {item.title}
                </p>
                {item.sub && (
                  <p className="mt-1 line-clamp-1 text-xs text-gray-400">{item.sub}</p>
                )}
              </div>
              <ChevronRight className="mt-1 h-4 w-4 self-end text-gray-300 transition-colors group-hover:text-[#D84315]" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
