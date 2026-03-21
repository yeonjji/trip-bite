// Wikimedia REST API — 한국어 위키백과 요약 + 썸네일 (무료, 키 불필요)

export interface WikiSummary {
  title: string
  extract: string // 한국어 설명글
  thumbnail?: {
    source: string
    width: number
    height: number
  }
  content_urls?: {
    desktop?: { page?: string }
  }
}

export async function getWikiSummary(title: string): Promise<WikiSummary | null> {
  try {
    const encoded = encodeURIComponent(title.trim())
    const url = `https://ko.wikipedia.org/api/rest_v1/page/summary/${encoded}`
    const res = await fetch(url, {
      next: { revalidate: 86400 }, // 24시간 캐시
      headers: { "User-Agent": "TripBite/1.0 (https://trip-bite.vercel.app)" },
    })

    if (!res.ok) return null

    const data: WikiSummary = await res.json()

    // 동음이의어 페이지 또는 내용이 너무 짧은 경우 제외
    if (!data.extract || data.extract.length < 50) return null

    return data
  } catch {
    return null
  }
}
