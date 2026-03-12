import { createClient } from "@/lib/supabase/server"
import { Review } from "@/types/database"
import Rating from "@/components/shared/Rating"

interface ReviewListProps {
  targetType: "destination" | "camping"
  targetId: string
}

export default async function ReviewList({
  targetType,
  targetId,
}: ReviewListProps) {
  const supabase = await createClient()

  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })

  if (error) {
    return (
      <p className="text-sm text-destructive">리뷰를 불러오지 못했습니다.</p>
    )
  }

  if (!reviews || reviews.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">아직 리뷰가 없습니다.</p>
    )
  }

  return (
    <ul className="flex flex-col gap-4">
      {reviews.map((review: Review) => (
        <li key={review.id} className="flex flex-col gap-1 border-b pb-4 last:border-b-0">
          <Rating value={review.rating} readonly size="sm" />
          {review.content && (
            <p className="text-sm text-foreground">{review.content}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {new Date(review.created_at).toLocaleDateString("ko-KR")}
          </p>
        </li>
      ))}
    </ul>
  )
}
