"use client"

import { useState } from "react"

import Rating from "@/components/shared/Rating"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface ReviewFormProps {
  targetType: "destination" | "camping"
  targetId: string
  onSuccess?: () => void
}

export default function ReviewForm({
  targetType,
  targetId,
  onSuccess,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) {
      setError("별점을 선택해주세요.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, rating, content }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "리뷰 작성에 실패했습니다.")
      }

      setRating(0)
      setContent("")
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "리뷰 작성에 실패했습니다.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-foreground">별점</label>
        <Rating value={rating} onChange={setRating} readonly={false} size="lg" />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-foreground">
          리뷰 내용 <span className="text-muted-foreground">(선택)</span>
        </label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="리뷰를 작성해주세요."
          rows={4}
          className="resize-none"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "제출 중..." : "리뷰 작성"}
      </Button>
    </form>
  )
}
