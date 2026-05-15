import { getWikiSummary } from "@/lib/api/wikipedia-api"

interface Props {
  title: string
  isKo: boolean
}

export default async function WikiSection({ title, isKo }: Props) {
  if (!title) return null

  let wiki
  try {
    wiki = await getWikiSummary(title)
  } catch (err) {
    console.error("[WikiSection] failed:", err)
    return null
  }

  if (!wiki || !wiki.extract) return null

  return (
    <div className="mb-6 rounded-xl bg-[#F9F7EF] p-4 soft-card-shadow">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-headline text-base font-bold text-[#1B1C1A]">
          {isKo ? "위키백과" : "Wikipedia"}
        </h2>
        {wiki.content_urls?.desktop?.page && (
          <a
            href={wiki.content_urls.desktop.page}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline"
          >
            {isKo ? "전체 보기" : "Read more"}
          </a>
        )}
      </div>
      <div className="flex items-start gap-3">
        {wiki.thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={wiki.thumbnail.source}
            alt={wiki.title}
            className="h-20 w-20 shrink-0 rounded-lg object-cover"
          />
        )}
        <p className="text-sm leading-relaxed text-[#5A413A] line-clamp-5">{wiki.extract}</p>
      </div>
    </div>
  )
}
