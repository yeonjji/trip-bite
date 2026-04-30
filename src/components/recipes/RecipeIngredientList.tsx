"use client"

import { useState } from "react"

interface Props {
  ingredients: string
}

function parseIngredients(raw: string): string[] {
  const results: string[] = []

  for (const line of raw.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // "주재료 :", "부재료:", "양념장 :" 같은 카테고리 헤더는 건너뜀
    // 패턴: 끝이 ":" 또는 내용이 없는 카테고리 행
    const colonOnly = /^[가-힣a-zA-Z\s]+\s*:\s*$/.test(trimmed)
    if (colonOnly) continue

    // "주재료 : 닭 1마리, 물 8컵" 처럼 카테고리 접두어가 붙은 경우 → 접두어 제거 후 쉼표 분리
    const prefixMatch = trimmed.match(/^[가-힣a-zA-Z\s]+\s*:\s*(.+)$/)
    if (prefixMatch) {
      const items = prefixMatch[1].split(",").map((s) => s.trim()).filter(Boolean)
      results.push(...items)
      continue
    }

    // 쉼표로 여러 재료가 한 줄에 있는 경우
    // 단, "200g, 소금 1작은술" 같이 수량 포함인 경우도 개별 항목으로 분리
    if (trimmed.includes(",")) {
      const items = trimmed.split(",").map((s) => s.trim()).filter(Boolean)
      results.push(...items)
      continue
    }

    results.push(trimmed)
  }

  return results
}

export default function RecipeIngredientList({ ingredients }: Props) {
  const items = parseIngredients(ingredients)
  const [checked, setChecked] = useState<Set<number>>(new Set())

  const toggle = (i: number) =>
    setChecked((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })

  const doneCount = checked.size

  return (
    <div>
      {doneCount > 0 && (
        <p className="mb-2 text-xs text-[#D84315]">
          {doneCount} / {items.length}개 준비 완료
        </p>
      )}
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i}>
            <button
              onClick={() => toggle(i)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-[#F9F7EF]"
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  checked.has(i)
                    ? "border-[#D84315] bg-[#D84315] text-white"
                    : "border-gray-300"
                }`}
              >
                {checked.has(i) && (
                  <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className={`text-sm leading-relaxed ${checked.has(i) ? "text-gray-400 line-through" : "text-[#1B1C1A]"}`}>
                {item}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
