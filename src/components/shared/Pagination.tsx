"use client"

import { ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalCount: number
  pageSize: number
  onPageChange: (page: number) => void
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | "...")[] = []

  if (current <= 4) {
    // 앞쪽: 1 2 3 4 5 ... last
    for (let i = 1; i <= 5; i++) pages.push(i)
    pages.push("...")
    pages.push(total)
  } else if (current >= total - 3) {
    // 뒤쪽: 1 ... last-4 last-3 last-2 last-1 last
    pages.push(1)
    pages.push("...")
    for (let i = total - 4; i <= total; i++) pages.push(i)
  } else {
    // 중간: 1 ... cur-1 cur cur+1 ... last
    pages.push(1)
    pages.push("...")
    pages.push(current - 1)
    pages.push(current)
    pages.push(current + 1)
    pages.push("...")
    pages.push(total)
  }

  return pages
}

export default function Pagination({
  currentPage,
  totalCount,
  pageSize,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.ceil(totalCount / pageSize)
  if (totalPages <= 1) return null

  const pages = getPageNumbers(currentPage, totalPages)

  const btnBase =
    "inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none"
  const btnNav =
    `${btnBase} border border-stone-200 bg-white text-stone-500 hover:bg-stone-100 hover:text-stone-700 disabled:opacity-30 disabled:cursor-not-allowed`
  const btnPage =
    `${btnBase} border border-stone-200 bg-white text-stone-600 hover:border-[#D84315] hover:text-[#D84315]`
  const btnActive =
    `${btnBase} border border-[#D84315] bg-[#D84315] text-white shadow-sm`

  return (
    <nav aria-label="페이지 탐색" className="flex items-center justify-center gap-1">
      {/* 처음 */}
      <button
        className={btnNav}
        onClick={() => onPageChange(1)}
        disabled={currentPage <= 1}
        aria-label="첫 페이지"
      >
        <ChevronsLeft className="h-4 w-4" />
      </button>

      {/* 이전 */}
      <button
        className={btnNav}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="이전 페이지"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* 페이지 번호 */}
      {pages.map((page, i) =>
        page === "..." ? (
          <span
            key={`ellipsis-${i}`}
            className="inline-flex h-9 w-9 items-center justify-center text-sm text-stone-400 select-none"
          >
            ···
          </span>
        ) : (
          <button
            key={page}
            className={page === currentPage ? btnActive : btnPage}
            onClick={() => onPageChange(page)}
            aria-label={`${page}페이지`}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </button>
        )
      )}

      {/* 다음 */}
      <button
        className={btnNav}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="다음 페이지"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* 마지막 */}
      <button
        className={btnNav}
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage >= totalPages}
        aria-label="마지막 페이지"
      >
        <ChevronsRight className="h-4 w-4" />
      </button>
    </nav>
  )
}
