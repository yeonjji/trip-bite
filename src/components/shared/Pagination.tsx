"use client"

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalCount: number
  pageSize: number
  onPageChange: (page: number) => void
}

/** 데스크탑: 최대 10개 + 생략 */
function getDesktopPages(current: number, total: number): (number | "...")[] {
  if (total <= 12) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 7) return [...Array.from({ length: 10 }, (_, i) => i + 1), "...", total]
  if (current >= total - 6) return [1, "...", ...Array.from({ length: 10 }, (_, i) => total - 9 + i)]
  return [1, "...", ...Array.from({ length: 7 }, (_, i) => current - 3 + i), "...", total]
}

/** 모바일: 현재 ±1 + 첫·끝 페이지 (최대 7개) */
function getMobilePages(current: number, total: number): (number | "...")[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 3) return [1, 2, 3, 4, "...", total]
  if (current >= total - 2) return [1, "...", total - 3, total - 2, total - 1, total]
  return [1, "...", current - 1, current, current + 1, "...", total]
}

export default function Pagination({ currentPage, totalCount, pageSize, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(totalCount / pageSize)
  if (totalPages <= 1) return null

  const desktopPages = getDesktopPages(currentPage, totalPages)
  const mobilePages = getMobilePages(currentPage, totalPages)

  const pageBtn = (page: number | "...", i: number) =>
    page === "..." ? (
      <span
        key={`e-${i}`}
        className="flex h-9 w-6 items-end justify-center pb-1.5 text-xs text-stone-400 select-none"
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
            ? "flex h-9 min-w-[36px] items-center justify-center rounded-xl px-2 text-sm font-semibold bg-[#b05a42] text-white shadow-sm"
            : "flex h-9 min-w-[36px] items-center justify-center rounded-xl px-2 text-sm text-stone-500 hover:bg-stone-100 hover:text-stone-800 transition-colors"
        }
      >
        {page}
      </button>
    )

  return (
    <nav aria-label="페이지 탐색" className="flex w-full max-w-full items-center justify-center gap-0.5 md:gap-1 px-2">
      {/* 맨 앞 */}
      <NavBtn onClick={() => onPageChange(1)} disabled={currentPage <= 1} aria-label="첫 페이지">
        <ChevronsLeft className="h-3.5 w-3.5" />
      </NavBtn>

      {/* 이전 */}
      <NavBtn onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1} aria-label="이전 페이지">
        <ChevronLeft className="h-3.5 w-3.5" />
      </NavBtn>

      {/* 모바일 페이지 번호 (compact) */}
      <div className="flex md:hidden items-center gap-0.5">
        {mobilePages.map((p, i) => pageBtn(p, i))}
      </div>

      {/* 데스크탑 페이지 번호 */}
      <div className="hidden md:flex items-center gap-0.5">
        {desktopPages.map((p, i) => pageBtn(p, i))}
      </div>

      {/* 다음 */}
      <NavBtn onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages} aria-label="다음 페이지">
        <ChevronRight className="h-3.5 w-3.5" />
      </NavBtn>

      {/* 맨 끝 */}
      <NavBtn onClick={() => onPageChange(totalPages)} disabled={currentPage >= totalPages} aria-label="마지막 페이지">
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
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  )
}
