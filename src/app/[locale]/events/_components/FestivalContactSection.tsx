import { Phone, Globe, Building2, ExternalLink } from "lucide-react"

interface Props {
  isKo: boolean
  tel?: string | null
  homepage?: string | null
  eventhomepage?: string | null
  sponsor1?: string | null
  sponsor1tel?: string | null
  sponsor2?: string | null
  sponsor2tel?: string | null
}

function extractHref(raw: string): string {
  const match = raw.match(/href=["']([^"']+)["']/)
  if (match) return match[1]
  return raw.startsWith("http") ? raw : `https://${raw}`
}

function extractText(raw: string): string {
  return raw.replace(/<[^>]+>/g, "").trim() || raw
}

export default function FestivalContactSection({
  isKo,
  tel,
  homepage,
  eventhomepage,
  sponsor1,
  sponsor1tel,
  sponsor2,
  sponsor2tel,
}: Props) {
  const webUrl = eventhomepage || homepage
  const hasAny = tel || webUrl || sponsor1 || sponsor2
  if (!hasAny) return null

  return (
    <div className="mb-6">
      <h2 className="mb-3 font-headline text-xl font-bold text-[#1B1C1A]">
        {isKo ? "문의 · 공식 정보" : "Contact & Info"}
      </h2>
      <div className="flex flex-col gap-2.5">
        {/* 전화 */}
        {tel && (
          <a
            href={`tel:${tel.replace(/\s/g, "")}`}
            className="flex items-center gap-3 rounded-xl bg-[#F9F7EF] px-4 py-3 transition hover:bg-[#FFF3EF]"
          >
            <Phone size={16} className="shrink-0 text-[#D84315]" />
            <div>
              <p className="text-xs text-muted-foreground">{isKo ? "전화 문의" : "Phone"}</p>
              <p className="text-sm font-semibold text-[#1B1C1A]">{tel}</p>
            </div>
          </a>
        )}

        {/* 공식 홈페이지 */}
        {webUrl && (
          <a
            href={extractHref(webUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl bg-[#F9F7EF] px-4 py-3 transition hover:bg-[#FFF3EF]"
          >
            <Globe size={16} className="shrink-0 text-[#D84315]" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">{isKo ? "공식 홈페이지" : "Website"}</p>
              <p className="truncate text-sm font-semibold text-[#D84315]">
                {extractText(webUrl)}
              </p>
            </div>
            <ExternalLink size={14} className="shrink-0 text-muted-foreground" />
          </a>
        )}

        {/* 주최/주관 */}
        {(sponsor1 || sponsor2) && (
          <div className="rounded-xl bg-[#F9F7EF] px-4 py-3">
            <div className="mb-2 flex items-center gap-2">
              <Building2 size={16} className="text-[#7B5E57]" />
              <p className="text-xs text-muted-foreground">{isKo ? "주최 · 주관" : "Organizer"}</p>
            </div>
            <div className="space-y-1.5">
              {sponsor1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[#1B1C1A]">{sponsor1}</p>
                  {sponsor1tel && (
                    <a
                      href={`tel:${sponsor1tel.replace(/\s/g, "")}`}
                      className="text-sm text-[#D84315] hover:underline"
                    >
                      {sponsor1tel}
                    </a>
                  )}
                </div>
              )}
              {sponsor2 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[#1B1C1A]">{sponsor2}</p>
                  {sponsor2tel && (
                    <a
                      href={`tel:${sponsor2tel.replace(/\s/g, "")}`}
                      className="text-sm text-[#D84315] hover:underline"
                    >
                      {sponsor2tel}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
