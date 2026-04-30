import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getRelatedRecipes } from "@/lib/data/recipes"
import RecipeCard from "@/components/cards/RecipeCard"

type Context = "travel" | "restaurant" | "festival" | "camping" | "general"

const SECTION_COPY: Record<Context, { title: string; sub: string }> = {
  travel:     { title: "여행지에서 맛본 음식, 집에서도 만들어보세요", sub: "이 지역과 어울리는 레시피를 소개합니다." },
  restaurant: { title: "이 지역 음식, 직접 만들어볼까요?",            sub: "현지 음식을 집에서 재현해보세요." },
  festival:   { title: "축제 음식, 집에서도 즐겨보세요",              sub: "이 지역 대표 음식 레시피를 만나보세요." },
  camping:    { title: "캠핑장에서 해먹기 좋은 레시피",               sub: "야외에서 즐기기 좋은 간편 레시피입니다." },
  general:    { title: "관련 레시피",                                  sub: "함께 즐기기 좋은 레시피를 추천해드려요." },
}

interface Props {
  regionName?: string | null
  context: Context
  locale: string
}

export default async function RecipeRecommendationSection({ regionName, context, locale }: Props) {
  const recipes = await getRelatedRecipes({ regionName, context, limit: 3 })
  if (recipes.length === 0) return null

  const { title, sub } = SECTION_COPY[context]

  return (
    <section className="mb-6">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="font-headline text-xl font-bold text-[#1B1C1A]">{title}</h2>
          <p className="mt-0.5 text-sm text-gray-400">{sub}</p>
        </div>
        <Link
          href={`/${locale}/recipes`}
          className="hidden shrink-0 items-center gap-1 text-sm font-medium text-[#D84315] hover:underline sm:flex"
        >
          더보기 <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {recipes.map((r) => (
          <RecipeCard key={r.id} item={r} locale={locale} />
        ))}
      </div>

      <div className="mt-4 sm:hidden">
        <Link
          href={`/${locale}/recipes`}
          className="inline-flex items-center gap-1 text-sm font-medium text-[#D84315] hover:underline"
        >
          레시피 더 보기 <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}
