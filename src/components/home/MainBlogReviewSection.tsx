"use client"

import { useState, useEffect, useCallback } from "react"
import { ExternalLink, User, Calendar, BookOpen } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

const REGIONS = ["서울", "부산", "제주", "강릉", "여수", "전주"] as const
const THEMES = ["전체", "당일치기", "맛집여행", "감성카페", "가족여행", "축제여행"] as const

type Region = (typeof REGIONS)[number]
type Theme = (typeof THEMES)[number]

interface BlogPost {
  title: string
  link: string
  description: string
  bloggername: string
  bloggerlink: string
  postdate: string
}

function formatDate(postdate: string) {
  if (!postdate || postdate.length !== 8) return postdate
  return `${postdate.slice(0, 4)}.${postdate.slice(4, 6)}.${postdate.slice(6, 8)}`
}

export default function MainBlogReviewSection() {
  const [region, setRegion] = useState<Region>("제주")
  const [theme, setTheme] = useState<Theme>("전체")
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchPosts = useCallback(async (r: Region, t: Theme) => {
    setLoading(true)
    setError(false)
    const query = t === "전체" ? `${r} 여행 후기` : `${r} ${t} 후기`
    try {
      const res = await fetch(`/api/naver/blog?query=${encodeURIComponent(query)}&display=6`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPosts(data.items ?? [])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts(region, theme)
  }, [region, theme, fetchPosts])

  return (
    <section className="bg-[#F9F7EF] py-12">
      <div className="mx-auto max-w-6xl px-4">
        {/* 헤더 */}
        <div className="mb-6">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#b05a42]">
            후기
          </p>
          <h2 className="font-headline text-2xl font-bold text-[#1B1C1A]">
            요즘 여행자들이 남긴 후기
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            네이버 블로그에서 확인할 수 있는 여행 후기를 모아봤어요.
          </p>
        </div>

        {/* 지역 탭 */}
        <div className="mb-3 flex flex-wrap gap-2">
          {REGIONS.map((r) => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                region === r
                  ? "bg-[#1B1C1A] text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* 테마 탭 */}
        <div className="mb-6 flex flex-wrap gap-2">
          {THEMES.map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                theme === t
                  ? "bg-[#b05a42] text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* 결과 */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <p className="py-10 text-center text-sm text-gray-400">
            여행 후기를 불러오지 못했습니다.
          </p>
        ) : posts.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">
            관련 여행 후기가 없습니다.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, i) => (
              <div
                key={i}
                className="flex flex-col justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F5F0] px-2 py-0.5 text-xs text-gray-500">
                    <BookOpen className="h-3 w-3" />
                    네이버 블로그
                  </span>

                  <p className="line-clamp-2 font-semibold leading-snug text-[#1B1C1A]">
                    {post.title}
                  </p>

                  {post.description && (
                    <p className="line-clamp-3 text-sm leading-relaxed text-gray-500">
                      {post.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 pt-1 text-xs text-gray-400">
                    {post.bloggername && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {post.bloggerlink ? (
                          <a
                            href={post.bloggerlink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-[#b05a42] hover:underline"
                          >
                            {post.bloggername}
                          </a>
                        ) : (
                          post.bloggername
                        )}
                      </span>
                    )}
                    {post.postdate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(post.postdate)}
                      </span>
                    )}
                  </div>
                </div>

                <a
                  href={post.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#1B1C1A] px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-80"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  후기 보러가기
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
