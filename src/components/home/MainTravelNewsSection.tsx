"use client"

import { useState, useEffect, useCallback } from "react"
import { ExternalLink, Calendar, Newspaper } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

const REGIONS = ["전국", "서울", "부산", "제주", "강릉", "여수", "전주"] as const
const TOPICS = ["전체", "축제", "관광", "전시", "여행", "맛집"] as const

type Region = (typeof REGIONS)[number]
type Topic = (typeof TOPICS)[number]

interface NewsItem {
  title: string
  originallink: string
  link: string
  description: string
  pubDate: string
}

function buildQuery(region: Region, topic: Topic): string {
  if (region === "전국" && topic === "전체") return "국내 여행 관광 뉴스"
  if (region === "전국") return `지역 ${topic}`
  if (topic === "전체") return `${region} 여행 관광`
  return `${region} ${topic}`
}

function formatPubDate(pubDate: string) {
  if (!pubDate) return ""
  const d = new Date(pubDate)
  if (isNaN(d.getTime())) return pubDate
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`
}

export default function MainTravelNewsSection() {
  const [region, setRegion] = useState<Region>("전국")
  const [topic, setTopic] = useState<Topic>("전체")
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchNews = useCallback(async (r: Region, t: Topic) => {
    setLoading(true)
    setError(false)
    try {
      const query = buildQuery(r, t)
      const res = await fetch(`/api/naver/news?query=${encodeURIComponent(query)}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setNews(data.items ?? [])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNews(region, topic)
  }, [region, topic, fetchNews])

  return (
    <section className="bg-white py-14">
      <div className="mx-auto max-w-6xl px-4">
        {/* 헤더 */}
        <div className="mb-8">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#D84315]">뉴스</p>
          <h2 className="font-headline text-2xl font-bold text-[#1B1C1A]">지역 축제·관광 소식</h2>
          <p className="mt-1 text-sm text-gray-500">최신 여행·축제 관련 뉴스를 확인해보세요.</p>
        </div>

        {/* 지역 탭 — 언더라인 세그먼트 */}
        <div className="mb-5 border-b border-gray-200">
          <div className="flex gap-0 overflow-x-auto scrollbar-none">
            {REGIONS.map((r) => (
              <button
                key={r}
                onClick={() => setRegion(r)}
                className={`shrink-0 px-5 py-2.5 text-sm font-medium transition-colors relative whitespace-nowrap
                  ${region === r
                    ? "text-[#1B1C1A] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#1B1C1A] after:rounded-full"
                    : "text-gray-400 hover:text-gray-600"
                  }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* 주제 칩 — 해시태그 스타일 */}
        <div className="mb-8 flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <button
              key={t}
              onClick={() => setTopic(t)}
              className={`rounded-full border px-3.5 py-1 text-xs font-medium transition-all ${
                topic === t
                  ? "border-[#D84315] bg-[#D84315]/8 text-[#D84315]"
                  : "border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700"
              }`}
            >
              #{t}
            </button>
          ))}
        </div>

        {/* 결과 */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <p className="py-10 text-center text-sm text-gray-400">관광 뉴스를 불러오지 못했습니다.</p>
        ) : news.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">관련 관광 뉴스가 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {news.map((item, i) => (
              <div
                key={i}
                className="flex flex-col justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF3EF] px-2 py-0.5 text-xs text-[#D84315]">
                    <Newspaper className="h-3 w-3" />
                    뉴스
                  </span>
                  <p className="line-clamp-2 font-semibold leading-snug text-[#1B1C1A]">{item.title}</p>
                  {item.description && (
                    <p className="line-clamp-3 text-sm leading-relaxed text-gray-500">{item.description}</p>
                  )}
                  {item.pubDate && (
                    <p className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar className="h-3 w-3" />
                      {formatPubDate(item.pubDate)}
                    </p>
                  )}
                </div>
                <a
                  href={item.originallink || item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#D84315] px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  기사 보러가기
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
