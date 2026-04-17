"use client"

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalCount: number
  pageSize: number
  onPageChange: (page: number) => void
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 12) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  // 앞쪽: 현재가 1~7 사이
  if (current <= 7) {
    return [...Array.from({ length: 10 }, (_, i) => i + 1), "...", total]
  }

  // 뒷쪽: 끝에서 6페이지 이내
  if (current >= total - 6) {
    return [1, "...", ...Array.from({ length: 10 }, (_, i) => total - 9 + i)]
  }

  // 중간: 현재 기준 앞뒤 3페이지씩
  return [1, "...", ...Array.from({ length: 7 }, (_, i) => current - 3 + i), "...", total]
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

  return (
    <nav aria-label="페이지 탐색" className="flex items-center justify-center gap-1">
      {/* 맨 앞 */}
      <NavBtn
        onClick={() => onPageChange(1)}
        disabled={currentPage <= 1}
        aria-label="첫 페이지"
      >
        <ChevronsLeft className="h-3.5 w-3.5" />
      </NavBtn>

      {/* 이전 */}
      <NavBtn
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="이전 페이지"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </NavBtn>

      <span className="mx-1" />

      {/* 페이지 번호 */}
      {pages.map((page, i) =>
        page === "..." ? (
          <span
            key={`ellipsis-${i}`}
            className="flex h-9 w-7 items-end justify-center pb-1.5 text-xs text-stone-400 select-none tracking-widest"
          >
            ···
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            aria-label={`${page}페이지`}
            aria-current={page === currentPage ? "page" : undefined}
            className={
              page === currentPage
                ? "flex h-9 min-w-[36px] items-center justify-center rounded-lg px-2 text-sm font-semibold bg-primary text-white shadow-sm"
                : "flex h-9 min-w-[36px] items-center justify-center rounded-lg px-2 text-sm text-stone-500 hover:bg-stone-100 hover:text-stone-800 transition-colors"
            }
          >
            {page}
          </button>
        )
      )}

      <span className="mx-1" />

      {/* 다음 */}
      <NavBtn
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="다음 페이지"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </NavBtn>

      {/* 맨 끝 */}
      <NavBtn
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage >= totalPages}
        aria-label="마지막 페이지"
      >
        <ChevronsRight className="h-3.5 w-3.5" />
      </NavBtn>
    </nav>
  )
}

function NavBtn({
  children,
  disabled,
  onClick,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode
  disabled: boolean
  onClick: () => void
  "aria-label": string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  )
}
