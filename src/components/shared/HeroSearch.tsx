import Link from "next/link"
import SearchBar from "@/components/search/SearchBar"

const POPULAR_KEYWORDS = ["제주도", "경복궁", "설악산", "부산 해운대", "전주 한옥마을"]

interface HeroSearchProps {
  locale: string
  variant: "overlay" | "compact"
  categoryPath?: string // e.g. "travel", "camping" — scopes search to category
  defaultValue?: string // current search query shown in input
}

export default function HeroSearch({ locale, variant, categoryPath, defaultValue }: HeroSearchProps) {
  const isKo = locale === "ko"
  const placeholder = isKo
    ? "여행지, 맛집, 캠핑장을 검색하세요"
    : "Search destinations, food, camping..."

  const keywords = (
    <div
      className={`${variant === "overlay" ? "mt-3 md:mt-6" : "mt-3"} flex flex-nowrap overflow-x-auto gap-1.5 md:flex-wrap md:justify-center md:gap-2 pb-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}
    >
      {POPULAR_KEYWORDS.map((keyword) => (
        <Link
          key={keyword}
          href={
            categoryPath
              ? `/${locale}/${categoryPath}?q=${encodeURIComponent(keyword)}`
              : `/${locale}/search?q=${encodeURIComponent(keyword)}`
          }
          className={`flex-shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs md:px-4 md:py-1.5 md:text-sm transition-colors ${
            variant === "overlay"
              ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
              : "bg-stone-100 text-stone-600 hover:bg-stone-200"
          }`}
        >
          {keyword}
        </Link>
      ))}
    </div>
  )

  if (variant === "overlay") {
    return (
      <>
        <div className="mx-auto max-w-lg">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-2 md:p-3 warm-shadow">
            <SearchBar placeholder={placeholder} categoryPath={categoryPath} defaultValue={defaultValue} />
          </div>
        </div>
        {keywords}
      </>
    )
  }

  return (
    <section className="bg-[#FFFDF5] border-b border-stone-100 py-6 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="bg-white rounded-2xl p-2.5 warm-shadow">
          <SearchBar placeholder={placeholder} categoryPath={categoryPath} defaultValue={defaultValue} />
        </div>
        {keywords}
      </div>
    </section>
  )
}
