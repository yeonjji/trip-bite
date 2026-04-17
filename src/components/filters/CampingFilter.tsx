"use client"

import { CAMPING_INDUTY } from "@/types/camping"

interface CampingFilterProps {
  induty: string
  onIndutyChange: (v: string) => void
}

const pill = (active: boolean) =>
  `whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
    active ? "bg-primary text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
  }`

export default function CampingFilter({ induty, onIndutyChange }: CampingFilterProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-foreground">업종</span>
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-2 flex-nowrap">
          <button className={pill(induty === "")} onClick={() => onIndutyChange("")}>
            전체
          </button>
          {Object.values(CAMPING_INDUTY).map((v) => (
            <button key={v} className={pill(induty === v)} onClick={() => onIndutyChange(v)}>
              {v}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
