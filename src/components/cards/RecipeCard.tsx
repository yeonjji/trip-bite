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
  const { id, name, category, cooking_method, main_image_url, hash_tags } = item

  return (
    <Link href={`/${locale}/recipes/${id}`} className="block">
      <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
        <div className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-muted">
          {main_image_url ? (
            <Image
              src={main_image_url}
              alt={name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <span className="text-sm">이미지 없음</span>
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
          </div>
          <h3 className="mt-1 line-clamp-1 font-medium text-foreground">{name}</h3>
          {cooking_method && (
            <p className="mt-1 text-xs text-muted-foreground">{cooking_method}</p>
          )}
          {hash_tags.length > 0 && (
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
