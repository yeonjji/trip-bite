import { searchKakaoPlace } from "@/lib/api/kakao-api"

interface Props {
  title: string
  lat?: number
  lng?: number
  isKo: boolean
}

export default async function KakaoLinkSection({ title, lat, lng, isKo }: Props) {
  if (!title) return null

  let kakaoPlace
  try {
    kakaoPlace = await searchKakaoPlace(title, lat, lng)
  } catch (err) {
    console.error("[KakaoLinkSection] failed:", err)
    return null
  }

  if (!kakaoPlace?.place_url) return null

  return (
    <a
      href={kakaoPlace.place_url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg bg-[#FFEDE7] px-4 py-2 text-sm font-medium text-[#D84315] hover:bg-[#D84315] hover:text-white transition-colors"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
      </svg>
      {isKo ? "카카오맵 보기" : "Kakao Map"}
    </a>
  )
}
