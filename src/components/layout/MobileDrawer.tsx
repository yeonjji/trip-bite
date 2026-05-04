"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { X, ChevronDown, Search } from "lucide-react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LanguageSwitcher } from "./LanguageSwitcher"
import { NAV_ITEMS } from "@/lib/constants/nav-items"

interface Props {
  locale: string
  isOpen: boolean
  onClose: () => void
}

export function MobileDrawer({ locale, isOpen, onClose }: Props) {
  const pathname = usePathname()
  const isKo = locale === "ko"
  const [expanded, setExpanded] = useState<string[]>([])

  // 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  const toggle = (key: string) =>
    setExpanded((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )

  return (
    <>
      {/* 반투명 오버레이 */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 사이드 드로어 */}
      <aside
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-80 max-w-[85vw] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out md:hidden",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        aria-modal="true"
        role="dialog"
      >
        {/* 드로어 헤더 */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <Link
            href={`/${locale}`}
            onClick={onClose}
            className="text-lg font-bold text-[#D84315]"
          >
            Trip Bite
          </Link>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100"
            aria-label="메뉴 닫기"
          >
            <X size={20} />
          </button>
        </div>

        {/* 네비게이션 항목 */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {NAV_ITEMS.map((item) => {
            const label = isKo ? item.labelKo : item.labelEn
            const topPath = `/${locale}${item.href}`
            const isActive = pathname === topPath || pathname.startsWith(`${topPath}/`)
            const isExpanded = expanded.includes(item.labelKo)

            return (
              <div key={item.labelKo} className="mb-0.5">
                <button
                  onClick={() => toggle(item.labelKo)}
                  className={cn(
                    "flex min-h-[48px] w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
                    isActive ? "text-[#D84315]" : "text-gray-800 hover:bg-gray-50"
                  )}
                >
                  <span>{label}</span>
                  <ChevronDown
                    size={16}
                    className={cn(
                      "text-gray-400 transition-transform duration-200",
                      isExpanded && "rotate-180"
                    )}
                  />
                </button>

                {/* 서브메뉴 아코디언 */}
                <div
                  className={cn(
                    "grid transition-[grid-template-rows] duration-300 ease-in-out",
                    isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  )}
                >
                  <div className="min-h-0 overflow-hidden">
                    <div className="ml-2 mb-2 space-y-0.5 pt-0.5">
                      {item.children.map((child) => {
                        const Icon = child.icon
                        const childLabel = isKo ? child.labelKo : child.labelEn
                        const childDesc = isKo ? child.descKo : child.descEn
                        const childHref = `/${locale}${child.href}`
                        const childPath = childHref.split("?")[0]
                        const childActive =
                          pathname === childPath ||
                          pathname.startsWith(`${childPath}/`)

                        return (
                          <Link
                            key={child.href}
                            href={childHref}
                            onClick={onClose}
                            className={cn(
                              "flex min-h-[52px] items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                              childActive
                                ? "bg-[#FFF3EF] text-[#D84315]"
                                : "text-gray-600 hover:bg-gray-50"
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                                childActive ? "bg-[#D84315]/10" : "bg-gray-100"
                              )}
                            >
                              <Icon
                                size={17}
                                className={
                                  childActive ? "text-[#D84315]" : "text-gray-500"
                                }
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium leading-tight">
                                {childLabel}
                              </p>
                              <p className="mt-0.5 text-[11px] leading-tight text-gray-400">
                                {childDesc}
                              </p>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </nav>

        {/* 하단: 검색 + 언어 전환 */}
        <div className="border-t border-gray-100 px-5 py-4">
          <Link
            href={`/${locale}/search`}
            onClick={onClose}
            className="mb-3 flex min-h-[44px] items-center gap-2 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600 transition-colors hover:bg-gray-100"
          >
            <Search size={16} />
            <span>{isKo ? "검색" : "Search"}</span>
          </Link>
          <div className="flex justify-center">
            <LanguageSwitcher />
          </div>
        </div>
      </aside>
    </>
  )
}
