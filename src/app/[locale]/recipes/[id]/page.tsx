import { notFound } from "next/navigation"
import Image from "next/image"
import type { Metadata } from "next"

import { Badge } from "@/components/ui/badge"
import { getRecipeDetail } from "@/lib/data/recipes"

interface PageProps {
  params: Promise<{ locale: string; id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const recipe = await getRecipeDetail(id)

  if (!recipe) {
    return { title: "레시피를 찾을 수 없습니다" }
  }

  return {
    title: recipe.name,
    description: recipe.ingredients?.slice(0, 150),
    openGraph: {
      title: recipe.name,
      images: recipe.main_image_url ? [recipe.main_image_url] : [],
    },
  }
}

export default async function RecipeDetailPage({ params }: PageProps) {
  const { locale, id } = await params
  const recipe = await getRecipeDetail(id)

  if (!recipe) {
    notFound()
  }

  const { name, category, cooking_method, main_image_url, ingredients, steps, nutrition, hash_tags } = recipe

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.name,
    recipeCategory: recipe.category,
    recipeIngredient: recipe.ingredients?.split("\n") ?? [],
    recipeInstructions: recipe.steps.map((s) => ({
      "@type": "HowToStep",
      text: s.description,
      image: s.image_url,
    })),
    nutrition: {
      "@type": "NutritionInformation",
      calories: recipe.nutrition.calories
        ? `${recipe.nutrition.calories} kcal`
        : undefined,
    },
    image: recipe.main_image_url,
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 대표 이미지 */}
      {main_image_url && (
        <div className="relative mb-6 aspect-video w-full overflow-hidden rounded-xl bg-muted">
          <Image
            src={main_image_url}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
          />
        </div>
      )}

      {/* 기본 정보 */}
      <div className="mb-6">
        <div className="mb-2 flex flex-wrap gap-2">
          {category && <Badge variant="secondary">{category}</Badge>}
          {cooking_method && <Badge variant="outline">{cooking_method}</Badge>}
        </div>
        <h1 className="text-2xl font-bold text-foreground">{name}</h1>
      </div>

      {/* 영양 정보 */}
      {(nutrition.calories || nutrition.carbs || nutrition.protein || nutrition.fat || nutrition.sodium) && (
        <section className="mb-6">
          <h2 className="mb-3 text-lg font-semibold text-foreground">영양 정보</h2>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <tbody>
                {nutrition.calories !== undefined && (
                  <tr className="border-b">
                    <th className="bg-muted/50 px-4 py-2 text-left font-medium text-muted-foreground">열량</th>
                    <td className="px-4 py-2">{nutrition.calories} kcal</td>
                  </tr>
                )}
                {nutrition.carbs !== undefined && (
                  <tr className="border-b">
                    <th className="bg-muted/50 px-4 py-2 text-left font-medium text-muted-foreground">탄수화물</th>
                    <td className="px-4 py-2">{nutrition.carbs} g</td>
                  </tr>
                )}
                {nutrition.protein !== undefined && (
                  <tr className="border-b">
                    <th className="bg-muted/50 px-4 py-2 text-left font-medium text-muted-foreground">단백질</th>
                    <td className="px-4 py-2">{nutrition.protein} g</td>
                  </tr>
                )}
                {nutrition.fat !== undefined && (
                  <tr className="border-b">
                    <th className="bg-muted/50 px-4 py-2 text-left font-medium text-muted-foreground">지방</th>
                    <td className="px-4 py-2">{nutrition.fat} g</td>
                  </tr>
                )}
                {nutrition.sodium !== undefined && (
                  <tr>
                    <th className="bg-muted/50 px-4 py-2 text-left font-medium text-muted-foreground">나트륨</th>
                    <td className="px-4 py-2">{nutrition.sodium} mg</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 재료 */}
      {ingredients && (
        <section className="mb-6">
          <h2 className="mb-3 text-lg font-semibold text-foreground">재료</h2>
          <p className="whitespace-pre-line text-sm text-muted-foreground">{ingredients}</p>
        </section>
      )}

      {/* 조리 순서 */}
      {steps.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">조리 순서</h2>
          <ol className="space-y-6">
            {steps.map((s) => (
              <li key={s.step} className="flex gap-4">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {s.step}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-foreground">{s.description}</p>
                  {s.image_url && (
                    <div className="relative mt-3 aspect-video w-full overflow-hidden rounded-lg bg-muted">
                      <Image
                        src={s.image_url}
                        alt={`조리 순서 ${s.step}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 600px"
                      />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* 해시태그 */}
      {hash_tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {hash_tags.map((tag) => (
            <Badge key={tag} variant="outline">
              #{tag}
            </Badge>
          ))}
        </div>
      )}
    </main>
  )
}
