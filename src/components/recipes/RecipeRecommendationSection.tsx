import { getRelatedRecipes } from "@/lib/data/recipes"
import HorizontalScrollSection from "@/components/shared/HorizontalScrollSection"

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
  const recipes = await getRelatedRecipes({ regionName, context, limit: 5 })
  if (recipes.length === 0) return null

  const { title, sub } = SECTION_COPY[context]

  return (
    <HorizontalScrollSection
      title={title}
      sub={sub}
      moreHref={`/${locale}/recipes`}
      moreLabel="레시피 전체"
      items={recipes.map((r) => ({
        href: `/${locale}/recipes/${r.id}`,
        imageUrl: r.main_image_url,
        imagePlaceholder: "🍽",
        tag: r.category ?? undefined,
        title: r.name,
        sub: r.cooking_method ?? undefined,
      }))}
    />
  )
}
