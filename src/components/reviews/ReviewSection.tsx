import ReviewForm from "@/components/reviews/ReviewForm"
import ReviewList from "@/components/reviews/ReviewList"

interface ReviewSectionProps {
  targetType: "destination" | "camping"
  targetId: string
}

export default function ReviewSection({
  targetType,
  targetId,
}: ReviewSectionProps) {
  return (
    <section className="flex flex-col gap-8">
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">리뷰 작성</h2>
        <ReviewForm targetType={targetType} targetId={targetId} />
      </div>
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">리뷰 목록</h2>
        <ReviewList targetType={targetType} targetId={targetId} />
      </div>
    </section>
  )
}
