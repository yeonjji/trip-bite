import { Suspense } from "react"
import type { Metadata } from "next"

import RecipeCard from "@/components/cards/RecipeCard"
import { buildAlternates } from "@/lib/utils/metadata"
import EmptyState from "@/components/shared/EmptyState"
import HeroSearch from "@/components/shared/HeroSearch"
import { getRecipes } from "@/lib/data/recipes"

import RecipeFilters from "./_components/RecipeFilters"
import ListingPagination from "@/components/shared/ListingPagination"

interface PageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{
    category?: string
    keyword?: string
    q?: string
    cuisine?: string
    page?: string
  }>
}

const PAGE_SIZE = 12

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === "en" ? "Recipes" : "레시피",
    description:
      locale === "en"
        ? "Discover Korean recipes made with local specialties."
        : "지역 특산품으로 만드는 한국 레시피를 탐색하세요.",
    alternates: buildAlternates("/recipes"),
  }
}

export default async function RecipesPage({ params, searchParams }: PageProps) {
  const { locale } = await params
  const { category, keyword, q, page: pageStr } = await searchParams
  const page = Number(pageStr ?? "1") || 1

  const { items, totalCount } = await getRecipes({
    category,
    keyword: q || keyword,
    page,
    pageSize: PAGE_SIZE,
  })

  return (
    <>
      <HeroSearch variant="compact" locale={locale} categoryPath="recipes" defaultValue={q || keyword} />
      <div className="mx-auto max-w-7xl px-4 pt-4 pb-8">
      <h1 className="mb-6 text-2xl font-bold text-foreground">레시피</h1>

      <Suspense>
        <RecipeFilters locale={locale} />
      </Suspense>

      <div className="mt-6">
        {items.length === 0 ? (
          <EmptyState
            title="레시피가 없습니다"
            description="다른 카테고리나 키워드로 검색해보세요."
          />
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              총 {totalCount.toLocaleString()}개
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((recipe) => (
                <RecipeCard key={recipe.id} item={recipe} locale={locale} />
              ))}
            </div>
          </>
        )}
      </div>

      {totalCount > PAGE_SIZE && (
        <div className="mt-8">
          <Suspense>
            <ListingPagination
              currentPage={page}
              totalCount={totalCount}
              pageSize={PAGE_SIZE}
            />
          </Suspense>
        </div>
      )}
    </div>
    </>
  )
}
