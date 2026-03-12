// P3-05: 접근성 배지 서버 컴포넌트

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface AccessibilityBadgeProps {
  type: "pet" | "wheelchair" | "foreign"
  size?: "sm" | "md"
}

const BADGE_CONFIG = {
  pet: { icon: "🐾", label: "반려동물" },
  wheelchair: { icon: "♿", label: "무장애" },
  foreign: { icon: "🌍", label: "외국인 친화" },
} as const

export default function AccessibilityBadge({
  type,
  size = "md",
}: AccessibilityBadgeProps) {
  const { icon, label } = BADGE_CONFIG[type]

  return (
    <Badge
      variant="secondary"
      className={cn(
        "gap-1",
        size === "sm" && "h-4 px-1.5 text-[10px]"
      )}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </Badge>
  )
}
