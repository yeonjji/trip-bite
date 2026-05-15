import Link from "next/link"
import { ChevronRight, ArrowRight } from "lucide-react"
import SafeThumbnail from "./SafeThumbnail"

export interface ScrollItem {
  href: string
  imageUrl?: string | null
  imagePlaceholder?: string
  tag?: string | null
  title: string
  sub?: string | null
  reason?: string | null
}

interface Props {
  title: string
  sub?: string
  items: ScrollItem[]
  moreHref?: string
  moreLabel?: string
  showImage?: boolean
}

export default function HorizontalScrollSection({ title, sub, items, moreHref, moreLabel, showImage = true }: Props) {
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
        {items.map((item) =>
          showImage ? (
            <Link
              key={item.href}
              href={item.href}
              className="group flex w-[140px] shrink-0 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              {/* 정사각형 썸네일 */}
              <div className="relative aspect-square w-full overflow-hidden bg-[#F4F1E9]">
                {item.imageUrl ? (
                  <SafeThumbnail
                    src={item.imageUrl}
                    alt={item.title}
                    placeholder={item.imagePlaceholder ?? "📍"}
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
                  {item.reason && (
                    <p className="mt-1 line-clamp-1 text-xs text-[#D84315]/70 font-medium">{item.reason}</p>
                  )}
                  {!item.reason && item.sub && (
                    <p className="mt-1 line-clamp-1 text-xs text-gray-400">{item.sub}</p>
                  )}
                </div>
                <ChevronRight className="mt-1 h-4 w-4 self-end text-gray-300 transition-colors group-hover:text-[#D84315]" />
              </div>
            </Link>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className="group flex w-[160px] shrink-0 flex-col justify-between rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div>
                {item.tag && (
                  <span className="inline-block rounded-full bg-[#FBE9E7] px-2 py-0.5 text-[10px] font-semibold text-[#D84315]">
                    {item.tag}
                  </span>
                )}
                <p className="mt-2 line-clamp-2 text-sm font-bold leading-snug text-[#1B1C1A]">
                  {item.title}
                </p>
                {item.reason && (
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-gray-400">{item.reason}</p>
                )}
                {!item.reason && item.sub && (
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-gray-400">{item.sub}</p>
                )}
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs font-medium text-[#D84315]/80 group-hover:text-[#D84315]">
                레시피 보기 <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          )
        )}
      </div>
    </div>
  )
}
