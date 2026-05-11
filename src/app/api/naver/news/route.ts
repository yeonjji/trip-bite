import { NextRequest, NextResponse } from "next/server"
import { getNaverCredentials, naverApiHeaders, stripHtml } from "../_utils"

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query")

  if (!query) {
    return NextResponse.json({ error: "query 파라미터가 필요합니다." }, { status: 400 })
  }

  const creds = getNaverCredentials()
  if (!creds) {
    return NextResponse.json({ error: "네이버 API 키가 설정되지 않았습니다." }, { status: 500 })
  }

  const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&display=5&sort=date`

  try {
    const res = await fetch(url, {
      headers: naverApiHeaders(creds.clientId, creds.clientSecret),
      next: { revalidate: 1800 },
    })

    if (!res.ok) {
      return NextResponse.json({ error: "네이버 API 호출에 실패했습니다." }, { status: res.status })
    }

    const data = await res.json()

    const items = (data.items ?? []).map((item: any) => ({
      title: stripHtml(item.title),
      originallink: item.originallink,
      link: item.link,
      description: stripHtml(item.description),
      pubDate: item.pubDate,
    }))

    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
