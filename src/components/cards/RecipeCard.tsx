import Image from "next/image"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { RecipeRow } from "@/types/database"

interface RecipeCardProps {
  item: RecipeRow
  locale?: string
}

export default function RecipeCard({ item, locale = "ko" }: RecipeCardProps) {
  const { id, name, category, cooking_method, main_image_url, hash_tags, source } = item
  const isTraditional = source === "향토음식"
  const regionTag = isTraditional ? hash_tags[0] : null

  return (
    <Link href={`/${locale}/recipes/${id}`} className="block group">
      <Card className="h-full cursor-pointer border-0 bg-white soft-card-shadow hover:warm-shadow transition-all duration-300 pt-0">
        <div className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-muted">
          {main_image_url ? (
            <Image
              src={main_image_url}
              alt={name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <span className="text-sm">이미지 없음</span>
            </div>
          )}
          {isTraditional && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-amber-500/90 text-white text-xs border-0">향토음식</Badge>
            </div>
          )}
        </div>
        <CardContent className="pt-3">
          <div className="flex flex-wrap items-center gap-1">
            {category && (
              <Badge variant="secondary" className="text-xs">
                {category}
              </Badge>
            )}
            {regionTag && (
              <Badge variant="outline" className="text-xs text-amber-700 border-amber-200 bg-amber-50">
                📍 {regionTag}
              </Badge>
            )}
          </div>
          <h3 className="mt-1 line-clamp-1 font-medium text-foreground">{name}</h3>
          {cooking_method && (
            <p className="mt-1 text-xs text-muted-foreground">{cooking_method}</p>
          )}
          {!isTraditional && hash_tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {hash_tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
