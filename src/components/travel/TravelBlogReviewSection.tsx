"use client"

import { useEffect, useState } from "react"
import { ExternalLink, User, Calendar, BookOpen } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface BlogPost {
  title: string
  link: string
  description: string
  bloggername: string
  bloggerlink: string
  postdate: string
}

interface Props {
  placeName: string
  regionName?: string | null
}

function formatDate(postdate: string) {
  if (!postdate || postdate.length !== 8) return postdate
  return `${postdate.slice(0, 4)}.${postdate.slice(4, 6)}.${postdate.slice(6, 8)}`
}

export default function TravelBlogReviewSection({ placeName, regionName }: Props) {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const query = regionName
      ? `${regionName} ${placeName} 여행 후기`
      : `${placeName} 여행 후기`

    const fetchPosts = async () => {
      setLoading(true)
      setError(false)
      try {
        const res = await fetch(`/api/naver/blog?query=${encodeURIComponent(query)}`)
        if (!res.ok) throw new Error()
        const data = await res.json()
        setPosts(data.items ?? [])
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [placeName, regionName])

  return (
    <div className="mb-6">
      <div className="mb-4">
        <h2 className="font-headline text-xl font-bold text-[#1B1C1A]">
          다녀온 사람들의 여행 후기
        </h2>
        <p className="mt-1 text-sm text-gray-400">
          네이버 블로그에서 확인할 수 있는 실제 여행 후기입니다.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <p className="py-6 text-center text-sm text-gray-400">
          여행 후기를 불러오지 못했습니다.
        </p>
      ) : posts.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">
          아직 관련 여행 후기가 없습니다.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {posts.map((post, i) => (
            <div
              key={i}
              className="flex flex-col justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="space-y-2">
                {/* 외부 블로그 출처 표시 */}
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
  )
}
