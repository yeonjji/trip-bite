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

  const base = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&sort=random`
  const headers = {
    "X-Naver-Client-Id": clientId,
    "X-Naver-Client-Secret": clientSecret,
  }

  try {
    const [res1, res2] = await Promise.all([
      fetch(`${base}&display=5&start=1`, { headers, next: { revalidate: 300 } }),
      fetch(`${base}&display=1&start=6`, { headers, next: { revalidate: 300 } }),
    ])

    const [data1, data2] = await Promise.all([
      res1.ok ? res1.json() : { items: [] },
      res2.ok ? res2.json() : { items: [] },
    ])

    const normalize = (item: any) => ({
      title: item.title.replace(/<[^>]*>/g, ""),
      category: item.category,
      roadAddress: item.roadAddress,
      address: item.address,
      telephone: item.telephone,
      link: item.link,
    })

    const items = [
      ...(data1.items ?? []).map(normalize),
      ...(data2.items ?? []).map(normalize),
    ]

    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
