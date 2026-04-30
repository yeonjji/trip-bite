"use client"

import { useState } from "react"

interface Props {
  ingredients: string
}

export default function RecipeIngredientList({ ingredients }: Props) {
  const lines = ingredients
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)

  const [checked, setChecked] = useState<Set<number>>(new Set())

  const toggle = (i: number) =>
    setChecked((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })

  return (
    <ul className="space-y-2">
      {lines.map((line, i) => (
        <li key={i}>
          <button
            onClick={() => toggle(i)}
            className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-[#F9F7EF]"
          >
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
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
              {line}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
