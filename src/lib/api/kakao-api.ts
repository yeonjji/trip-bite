// Kakao Local API — 장소 검색 및 딥링크 (무료)

export interface KakaoPlace {
  id: string
  place_name: string
  place_url: string // 카카오맵 상세페이지 딥링크
  road_address_name: string
  address_name: string
  phone: string
  x: string // lng
  y: string // lat
}

interface KakaoSearchResponse {
  documents: KakaoPlace[]
  meta: { total_count: number }
}

export interface KakaoTransitPlace {
  id: string
  place_name: string
  place_url: string
  distance: string // meters as string
}

interface KakaoCategoryResponse {
  documents: (KakaoTransitPlace & { category_group_code: string })[]
  meta: { total_count: number }
}

export async function searchKakaoPlace(
  query: string,
  lat?: number,
  lng?: number
): Promise<KakaoPlace | null> {
  const key = process.env.KAKAO_REST_API_KEY
  if (!key) return null

  try {
    const params = new URLSearchParams({ query, size: "1" })
    if (lat && lng) {
      params.set("x", String(lng))
      params.set("y", String(lat))
      params.set("sort", "distance")
    }

    const res = await fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?${params}`,
      {
        next: { revalidate: 86400 },
        headers: { Authorization: `KakaoAK ${key}` },
      }
    )

    if (!res.ok) return null

    const data: KakaoSearchResponse = await res.json()
    return data.documents?.[0] ?? null
  } catch {
    return null
  }
}

export async function searchNearbyTransit(
  lat: number,
  lng: number,
  categoryCode: "SW8",
  radius = 1000,
  size = 5
): Promise<KakaoTransitPlace[]> {
  const key = process.env.KAKAO_REST_API_KEY
  if (!key) return []

  try {
    const params = new URLSearchParams({
      category_group_code: categoryCode,
      x: String(lng),
      y: String(lat),
      radius: String(radius),
      sort: "distance",
      size: String(size),
    })

    const res = await fetch(
      `https://dapi.kakao.com/v2/local/search/category.json?${params}`,
      {
        next: { revalidate: 86400 },
        headers: { Authorization: `KakaoAK ${key}` },
      }
    )

    if (!res.ok) return []

    const data: KakaoCategoryResponse = await res.json()
    return data.documents ?? []
  } catch {
    return []
  }
}
