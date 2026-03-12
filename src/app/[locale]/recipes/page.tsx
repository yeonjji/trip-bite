import { Suspense } from "react"

import RecipeCard from "@/components/cards/RecipeCard"
import EmptyState from "@/components/shared/EmptyState"
import { getRecipes } from "@/lib/data/recipes"

import RecipeFilters from "./_components/RecipeFilters"
import RecipePagination from "./_components/RecipePagination"

interface PageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{
    category?: string
    keyword?: string
    page?: string
  }>
}

const PAGE_SIZE = 12

export default async function RecipesPage({ params, searchParams }: PageProps) {
  const { locale } = await params
  const { category, keyword, page: pageStr } = await searchParams
  const page = Number(pageStr ?? "1") || 1

  const { items, totalCount } = await getRecipes({
    category,
    keyword,
    page,
    pageSize: PAGE_SIZE,
  })

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
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
            <RecipePagination
              locale={locale}
              currentPage={page}
              totalCount={totalCount}
              pageSize={PAGE_SIZE}
            />
          </Suspense>
        </div>
      )}
    </main>
  )
}
