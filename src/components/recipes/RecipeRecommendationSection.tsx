import Link from "next/link"
import Image from "next/image"
import { ArrowRight, ChevronRight } from "lucide-react"
import { getRelatedRecipes } from "@/lib/data/recipes"

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
    <div className="mb-6">
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

      <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white shadow-sm">
        {recipes.map((r) => {
          const ingredientPreview = r.ingredients
            ? r.ingredients.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 3).join(" · ")
            : null

          return (
            <li key={r.id}>
              <Link
                href={`/${locale}/recipes/${r.id}`}
                className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-[#FFF8F5]"
              >
                {/* 썸네일 */}
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[#F4F1E9]">
                  {r.main_image_url ? (
                    <Image
                      src={r.main_image_url}
                      alt={r.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xl">🍽</div>
                  )}
                </div>

                {/* 텍스트 */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[#1B1C1A]">{r.name}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400">
                    {r.category && <span>{r.category}</span>}
                    {r.cooking_method && (
                      <>
                        <span>·</span>
                        <span>{r.cooking_method}</span>
                      </>
                    )}
                  </div>
                  {ingredientPreview && (
                    <p className="mt-0.5 truncate text-xs text-gray-400">{ingredientPreview}</p>
                  )}
                </div>

                <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
              </Link>
            </li>
          )
        })}
      </ul>

      <div className="mt-3 sm:hidden">
        <Link
          href={`/${locale}/recipes`}
          className="inline-flex items-center gap-1 text-sm font-medium text-[#D84315] hover:underline"
        >
          레시피 더 보기 <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
