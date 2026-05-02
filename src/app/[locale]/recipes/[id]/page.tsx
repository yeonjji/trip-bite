import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { Flame, ArrowRight, MapPin } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { getRecipeDetail } from "@/lib/data/recipes"
import { buildAlternates } from "@/lib/utils/metadata"
import RecipeIngredientList from "@/components/recipes/RecipeIngredientList"
import SafeRecipeImage from "@/components/recipes/SafeRecipeImage"

interface PageProps {
  params: Promise<{ locale: string; id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const recipe = await getRecipeDetail(id)
  if (!recipe) return { title: "레시피를 찾을 수 없습니다" }
  return {
    title: recipe.name,
    description: recipe.ingredients?.slice(0, 150),
    openGraph: {
      title: recipe.name,
      images: recipe.main_image_url ? [recipe.main_image_url] : [],
    },
    alternates: buildAlternates(`/recipes/${id}`),
  }
}

export default async function RecipeDetailPage({ params }: PageProps) {
  const { locale, id } = await params
  const recipe = await getRecipeDetail(id)
  if (!recipe) notFound()

  const { name, category, cooking_method, main_image_url, finished_image_url, ingredients, steps, nutrition, hash_tags, source } = recipe
  const isTraditional = source === "향토음식"
  const regionName = isTraditional && hash_tags[0] ? hash_tags[0] : null
  const hasNutrition = nutrition.calories || nutrition.carbs || nutrition.protein || nutrition.fat || nutrition.sodium

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name,
    recipeCategory: category,
    recipeIngredient: ingredients?.split("\n").map((s) => s.trim()).filter(Boolean) ?? [],
    recipeInstructions: steps.map((s) => ({
      "@type": "HowToStep",
      text: s.description,
      image: s.image_url,
    })),
    image: main_image_url,
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* 뒤로가기 */}
      <Link
        href={`/${locale}/recipes`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#D84315] transition-colors"
      >
        ← 레시피 목록
      </Link>

      {/* Hero 이미지 */}
      <div className="relative mb-6 aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[#F4F1E9] sm:aspect-video">
        <SafeRecipeImage src={main_image_url} alt={name} sizes="(max-width: 768px) 100vw, 768px" priority />
        {/* 배지 오버레이 */}
        <div className="absolute left-3 top-3 flex gap-2">
          {isTraditional && (
            <Badge className="bg-amber-500 text-white border-0 shadow">향토음식</Badge>
          )}
        </div>
      </div>

      {/* 제목 & 기본 정보 */}
      <div className="mb-8">
        <div className="mb-2 flex flex-wrap gap-2">
          {category && <Badge variant="secondary">{category}</Badge>}
          {cooking_method && <Badge variant="outline">{cooking_method}</Badge>}
        </div>
        <h1 className="font-headline text-3xl font-extrabold text-[#1B1C1A]">{name}</h1>
        {regionName && (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-500">
            <MapPin className="h-4 w-4 text-[#D84315]" />
            {regionName} 향토음식
          </p>
        )}
      </div>

      {/* 영양 정보 */}
      {hasNutrition && (
        <section className="mb-8">
          <h2 className="mb-4 font-headline text-xl font-bold text-[#1B1C1A]">영양 정보</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { label: "열량", value: nutrition.calories, unit: "kcal" },
              { label: "탄수화물", value: nutrition.carbs, unit: "g" },
              { label: "단백질", value: nutrition.protein, unit: "g" },
              { label: "지방", value: nutrition.fat, unit: "g" },
              { label: "나트륨", value: nutrition.sodium, unit: "mg" },
            ]
              .filter((n) => n.value !== undefined)
              .map((n) => (
                <div key={n.label} className="flex flex-col items-center rounded-xl bg-[#FFF8F5] p-3 text-center">
                  <span className="text-xs text-gray-500">{n.label}</span>
                  <span className="mt-1 text-lg font-bold text-[#D84315]">{n.value}</span>
                  <span className="text-xs text-gray-400">{n.unit}</span>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* 재료 */}
      {ingredients && (
        <section className="mb-8">
          <h2 className="mb-4 font-headline text-xl font-bold text-[#1B1C1A]">재료</h2>
          <p className="mb-3 text-xs text-gray-400">재료를 준비하면서 체크해보세요.</p>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <RecipeIngredientList ingredients={ingredients} />
          </div>
        </section>
      )}

      {/* 조리 순서 */}
      {steps.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-6 font-headline text-xl font-bold text-[#1B1C1A]">
            <span className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-[#D84315]" />
              조리 순서
            </span>
          </h2>
          <ol className="space-y-8">
            {steps.map((s) => (
              <li key={s.step} className="flex gap-4">
                <div className="flex flex-col items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#D84315] text-sm font-bold text-white">
                    {s.step}
                  </span>
                  {steps.indexOf(s) < steps.length - 1 && (
                    <div className="w-0.5 flex-1 bg-gray-100" />
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <p className="text-sm leading-relaxed text-[#1B1C1A]">{s.description}</p>
                  {s.image_url && (
                    <div className="mt-3">
                      <SafeRecipeImage src={s.image_url} alt={`조리 순서 ${s.step}`} compact sizes="(max-width: 768px) 100vw, 600px" />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* 완성 이미지 */}
      {finished_image_url && finished_image_url !== main_image_url && (
        <section className="mb-8">
          <SafeRecipeImage src={finished_image_url} alt={`${name} 완성 이미지`} compact sizes="(max-width: 768px) 100vw, 768px" />
        </section>
      )}

      {/* 해시태그 (식약처만) */}
      {!isTraditional && hash_tags.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {hash_tags.map((tag) => (
            <Badge key={tag} variant="outline">#{tag}</Badge>
          ))}
        </div>
      )}

      {/* 내부 연결 — 지역 기반 */}
      {regionName && (
        <section className="mb-8 rounded-2xl bg-[#FFF8F5] p-6">
          <h2 className="mb-4 font-headline text-lg font-bold text-[#1B1C1A]">
            {regionName}에서 직접 맛보고 싶다면?
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              href={`/${locale}/travel?region=${encodeURIComponent(regionName)}`}
              className="flex items-center justify-between rounded-xl border border-[#D84315]/20 bg-white px-4 py-3 text-sm font-medium text-[#D84315] hover:bg-[#D84315] hover:text-white transition-colors"
            >
              <span>🗺 {regionName} 여행지 탐색</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`/${locale}/restaurants?region=${encodeURIComponent(regionName)}`}
              className="flex items-center justify-between rounded-xl border border-[#D84315]/20 bg-white px-4 py-3 text-sm font-medium text-[#D84315] hover:bg-[#D84315] hover:text-white transition-colors"
            >
              <span>🍽 {regionName} 맛집 탐색</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`/${locale}/events?region=${encodeURIComponent(regionName)}`}
              className="flex items-center justify-between rounded-xl border border-[#D84315]/20 bg-white px-4 py-3 text-sm font-medium text-[#D84315] hover:bg-[#D84315] hover:text-white transition-colors"
            >
              <span>🎊 {regionName} 축제 보기</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`/${locale}/recipes`}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <span>📖 다른 레시피 탐색</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {/* 캠핑 추천 */}
      {!regionName && (
        <section className="mb-8 rounded-2xl bg-[#F5FAF5] p-6">
          <h2 className="mb-4 font-headline text-lg font-bold text-[#1B1C1A]">이 레시피와 함께 즐겨보세요</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              href={`/${locale}/camping`}
              className="flex items-center justify-between rounded-xl border border-green-200 bg-white px-4 py-3 text-sm font-medium text-green-700 hover:bg-green-50 transition-colors"
            >
              <span>⛺ 캠핑장에서 해먹기</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`/${locale}/recipes`}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <span>📖 다른 레시피 탐색</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {/* 출처 */}
      <footer className="border-t border-gray-100 pt-6 text-xs text-gray-400">
        <p>
          출처:{" "}
          {isTraditional
            ? "농촌진흥청 농식품종합정보시스템 향토음식 데이터"
            : "식품의약품안전처 식품영양성분 데이터베이스"}
        </p>
        <p className="mt-1">본 레시피는 공공데이터를 활용한 정보입니다.</p>
      </footer>
    </main>
  )
}
