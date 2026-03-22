"use client"

import { Button } from "@/components/ui/button"
import { CAMPING_INDUTY } from "@/types/camping"

interface CampingFilterProps {
  induty: string
  onIndutyChange: (v: string) => void
}

export default function CampingFilter({
  induty,
  onIndutyChange,
}: CampingFilterProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm font-medium text-foreground">업종</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={induty === "" ? "default" : "outline"}
            size="sm"
            onClick={() => onIndutyChange("")}
          >
            전체
          </Button>
          {Object.values(CAMPING_INDUTY).map((v) => (
            <Button
              key={v}
              variant={induty === v ? "default" : "outline"}
              size="sm"
              onClick={() => onIndutyChange(v)}
            >
              {v}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
