"use client"

import { Star } from "lucide-react"
import { useState } from "react"

import { cn } from "@/lib/utils"

interface RatingProps {
  value: number
  max?: number
  size?: "sm" | "md" | "lg"
  showValue?: boolean
  onChange?: (v: number) => void
  readonly?: boolean
}

const sizeMap = {
  sm: "size-3.5",
  md: "size-5",
  lg: "size-7",
}

const textSizeMap = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
}

export default function Rating({
  value,
  max = 5,
  size = "md",
  showValue = false,
  onChange,
  readonly = true,
}: RatingProps) {
  const [hovered, setHovered] = useState<number | null>(null)

  const displayValue = hovered ?? value

  return (
    <div className="inline-flex items-center gap-1">
      <div className="flex items-center">
        {Array.from({ length: max }, (_, i) => {
          const starValue = i + 1
          const filled = starValue <= displayValue

          return (
            <button
              key={i}
              type="button"
              disabled={readonly}
              onClick={() => !readonly && onChange?.(starValue)}
              onMouseEnter={() => !readonly && setHovered(starValue)}
              onMouseLeave={() => !readonly && setHovered(null)}
              className={cn(
                "transition-colors",
                readonly ? "cursor-default" : "cursor-pointer"
              )}
              aria-label={`${starValue}점`}
            >
              <Star
                className={cn(
                  sizeMap[size],
                  filled
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-muted text-muted-foreground"
                )}
              />
            </button>
          )
        })}
      </div>
      {showValue && (
        <span className={cn(textSizeMap[size], "text-muted-foreground")}>
          {value.toFixed(1)}
        </span>
      )}
    </div>
  )
}
