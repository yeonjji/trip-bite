import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query")

  if (!query) {
    return NextResponse.json({ error: "query 파라미터가 필요합니다." }, { status: 400 })
  }

  const clientId = process.env.NAVER_LOCAL_CLIENT_ID
  const clientSecret = process.env.NAVER_LOCAL_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "네이버 API 키가 설정되지 않았습니다." }, { status: 500 })
  }

  const url = `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(query)}&display=4&sort=sim`

  try {
    const res = await fetch(url, {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
      next: { revalidate: 3600 },
    })

    if (!res.ok) {
      return NextResponse.json({ error: "네이버 API 호출에 실패했습니다." }, { status: res.status })
    }

    const data = await res.json()

    const items = (data.items ?? []).map((item: any) => ({
      title: item.title.replace(/<[^>]*>/g, ""),
      link: item.link,
      description: item.description.replace(/<[^>]*>/g, ""),
      bloggername: item.bloggername,
      bloggerlink: item.bloggerlink,
      postdate: item.postdate,
    }))

    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
