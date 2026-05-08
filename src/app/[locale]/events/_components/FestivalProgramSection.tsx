"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

interface Props {
  isKo: boolean
  program?: string | null
  subevent?: string | null
}

const COLLAPSE_HEIGHT = 280

export default function FestivalProgramSection({ isKo, program, subevent }: Props) {
  const [programExpanded, setProgramExpanded] = useState(false)
  const [subeventExpanded, setSubeventExpanded] = useState(false)

  const hasProgram = !!program?.trim()
  const hasSubevent = !!subevent?.trim()

  if (!hasProgram && !hasSubevent) return null

  return (
    <div className="mb-6">
      <h2 className="mb-4 font-headline text-xl font-bold text-[#1B1C1A]">
        {isKo ? "행사 프로그램" : "Program"}
      </h2>

      {hasProgram && (
        <div className="mb-4 rounded-2xl bg-[#F9F7EF] p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#7B5E57]">
            {isKo ? "주요 프로그램 · 공연 · 체험" : "Main Program"}
          </p>
          <div
            className="relative overflow-hidden transition-all duration-300"
            style={{ maxHeight: programExpanded ? "none" : COLLAPSE_HEIGHT }}
          >
            <div
              className="prose prose-sm max-w-none leading-relaxed text-[#5A413A] [&_br]:block [&_p]:mb-2"
              dangerouslySetInnerHTML={{ __html: program! }}
            />
            {!programExpanded && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#F9F7EF] to-transparent" />
            )}
          </div>
          <button
            onClick={() => setProgramExpanded((v) => !v)}
            className="mt-3 flex items-center gap-1 text-sm font-medium text-[#D84315] hover:underline"
          >
            {programExpanded ? (
              <>
                {isKo ? "접기" : "Show less"} <ChevronUp size={16} />
              </>
            ) : (
              <>
                {isKo ? "더 보기" : "Show more"} <ChevronDown size={16} />
              </>
            )}
          </button>
        </div>
      )}

      {hasSubevent && (
        <div className="rounded-2xl border border-[#E8D5C0] bg-white p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#7B5E57]">
            {isKo ? "부대행사" : "Side Events"}
          </p>
          <div
            className="relative overflow-hidden transition-all duration-300"
            style={{ maxHeight: subeventExpanded ? "none" : COLLAPSE_HEIGHT }}
          >
            <div
              className="prose prose-sm max-w-none leading-relaxed text-[#5A413A] [&_br]:block [&_p]:mb-2"
              dangerouslySetInnerHTML={{ __html: subevent! }}
            />
            {!subeventExpanded && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
            )}
          </div>
          <button
            onClick={() => setSubeventExpanded((v) => !v)}
            className="mt-3 flex items-center gap-1 text-sm font-medium text-[#D84315] hover:underline"
          >
            {subeventExpanded ? (
              <>
                {isKo ? "접기" : "Show less"} <ChevronUp size={16} />
              </>
            ) : (
              <>
                {isKo ? "더 보기" : "Show more"} <ChevronDown size={16} />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
