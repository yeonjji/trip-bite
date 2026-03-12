// P3-06: 대상 그룹 필터 클라이언트 컴포넌트

"use client"

import AccessibilityBadge from "@/components/shared/AccessibilityBadge"

type TargetGroup = "pet" | "wheelchair" | "foreign"

const OPTIONS: TargetGroup[] = ["pet", "wheelchair", "foreign"]

interface TargetGroupFilterProps {
  values: string[]
  onChange: (values: string[]) => void
}

export default function TargetGroupFilter({
  values,
  onChange,
}: TargetGroupFilterProps) {
  function handleToggle(option: TargetGroup) {
    if (values.includes(option)) {
      onChange(values.filter((v) => v !== option))
    } else {
      onChange([...values, option])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((option) => {
        const selected = values.includes(option)
        return (
          <label
            key={option}
            className="flex cursor-pointer items-center gap-1.5"
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={selected}
              onChange={() => handleToggle(option)}
            />
            <span
              className={
                selected
                  ? "ring-2 ring-primary ring-offset-1 rounded-full"
                  : "opacity-60"
              }
            >
              <AccessibilityBadge type={option} size="md" />
            </span>
          </label>
        )
      })}
    </div>
  )
}
