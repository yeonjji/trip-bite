import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import type { AudioGuideItem } from "@/lib/api/audio-guide-api"

interface AudioGuideCardProps {
  item: AudioGuideItem
}

export default function AudioGuideCard({ item }: AudioGuideCardProps) {
  const { title, addr1, addr2, themeCategory, imageUrl } = item

  return (
    <Card className="h-full transition-shadow hover:shadow-md pt-0">
      <div className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <span className="text-4xl">🎧</span>
          </div>
        )}
        <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
          🎧 오디오
        </span>
      </div>
      <CardContent className="pt-3">
        <h3 className="line-clamp-1 font-medium text-foreground">{title}</h3>
        {(addr1 || addr2) && (
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
            {[addr1, addr2].filter(Boolean).join(" ")}
          </p>
        )}
        {themeCategory && (
          <span className="mt-2 inline-block text-xs text-primary">{themeCategory}</span>
        )}
      </CardContent>
    </Card>
  )
}
