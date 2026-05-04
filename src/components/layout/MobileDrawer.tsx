"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { X, ChevronDown, Search } from "lucide-react"
import { useTranslations } from "next-intl"
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
  const t = useTranslations("nav")
  const pathname = usePathname()
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
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
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
        aria-label="내비게이션 메뉴"
      >
        {/* 헤더 */}
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
            const topHref = `/${locale}${item.href}`
            const isActive =
              pathname === topHref || pathname.startsWith(`${topHref}/`)
            const isExpanded = expanded.includes(item.labelKey)

            if (item.children.length === 0) {
              return (
                <Link
                  key={item.labelKey}
                  href={topHref}
                  onClick={onClose}
                  className={cn(
                    "flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#FFF3EF] text-[#D84315]"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {t(item.labelKey as any)}
                </Link>
              )
            }

            return (
              <div key={item.labelKey}>
                <button
                  onClick={() => toggle(item.labelKey)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                    isActive ? "text-[#D84315]" : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <span>{t(item.labelKey as any)}</span>
                  <ChevronDown
                    size={16}
                    className={cn(
                      "text-gray-400 transition-transform duration-200",
                      isExpanded && "rotate-180"
                    )}
                  />
                </button>

                {isExpanded && (
                  <div className="mb-1 ml-4 border-l border-gray-100 pl-3">
                    {item.children.map((child) => {
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
                            "block rounded-lg px-3 py-2.5 text-sm transition-colors",
                            childActive
                              ? "font-semibold text-[#D84315]"
                              : "text-gray-500 hover:text-gray-800"
                          )}
                        >
                          {t(child.labelKey as any)}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* 하단: 검색 + 언어 전환 */}
        <div className="border-t border-gray-100 px-5 py-4">
          <Link
            href={`/${locale}/search`}
            onClick={onClose}
            className="mb-3 flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600 transition-colors hover:bg-gray-100"
          >
            <Search size={16} />
            <span>{t("search")}</span>
          </Link>
          <div className="flex justify-center">
            <LanguageSwitcher />
          </div>
        </div>
      </aside>
    </>
  )
}
