"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { NAV_ITEMS } from "@/lib/constants/nav-items"

interface Props {
  locale: string
  isKo: boolean
}

export function MegaMenu({ locale, isKo }: Props) {
  const [openKey, setOpenKey] = useState<string | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pathname = usePathname()

  const open = (key: string) => {
    clearTimeout(closeTimer.current)
    setOpenKey(key)
  }

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setOpenKey(null), 120)
  }

  const cancelClose = () => clearTimeout(closeTimer.current)

  const colsClass = (count: number) =>
    count === 2 ? "grid-cols-2" : count === 3 ? "grid-cols-3" : "grid-cols-2"

  const minWidthClass = (count: number) =>
    count === 2 ? "min-w-[340px]" : count === 3 ? "min-w-[500px]" : "min-w-[380px]"

  return (
    <nav className="hidden items-center gap-1 md:flex">
      {NAV_ITEMS.map((item) => {
        const isOpen = openKey === item.labelKo
        const label = isKo ? item.labelKo : item.labelEn
        const topPath = `/${locale}${item.href}`
        const isActive = pathname === topPath || pathname.startsWith(`${topPath}/`)

        return (
          <div
            key={item.labelKo}
            className="relative"
            onMouseEnter={() => open(item.labelKo)}
            onMouseLeave={scheduleClose}
          >
            {/* 상위 메뉴 버튼 */}
            <Link
              href={topPath}
              className={cn(
                "flex items-center rounded-full px-4 py-2 text-sm font-medium transition-all duration-150",
                isOpen || isActive
                  ? "bg-[#FFF3EF] text-[#D84315]"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              {label}
            </Link>

            {/* 메가 드롭다운 */}
            <div
              className={cn(
                "absolute left-0 top-full z-50 pt-2 transition-all duration-200 ease-out",
                isOpen
                  ? "pointer-events-auto translate-y-0 opacity-100"
                  : "pointer-events-none -translate-y-1 opacity-0"
              )}
              onMouseEnter={cancelClose}
              onMouseLeave={scheduleClose}
            >
              <div
                className={cn(
                  "grid gap-1 rounded-2xl border border-gray-100 bg-white p-2 shadow-xl",
                  colsClass(item.children.length),
                  minWidthClass(item.children.length)
                )}
              >
                {item.children.map((child) => {
                  const Icon = child.icon
                  const childLabel = isKo ? child.labelKo : child.labelEn
                  const childDesc = isKo ? child.descKo : child.descEn
                  const childPath = `/${locale}${child.href.split("?")[0]}`
                  const childActive =
                    pathname === childPath || pathname.startsWith(`${childPath}/`)

                  return (
                    <Link
                      key={child.href}
                      href={`/${locale}${child.href}`}
                      onClick={() => setOpenKey(null)}
                      className={cn(
                        "group flex items-start gap-3 rounded-xl p-3 transition-all duration-150",
                        childActive ? "bg-[#FFF3EF]" : "hover:bg-[#FFF8F5]"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                          childActive
                            ? "bg-[#D84315]/10"
                            : "bg-[#FFF3EF] group-hover:bg-[#D84315]/10"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-[18px] w-[18px] transition-colors",
                            childActive
                              ? "text-[#D84315]"
                              : "text-[#D84315]/70 group-hover:text-[#D84315]"
                          )}
                        />
                      </div>
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "text-sm font-semibold leading-none transition-colors",
                            childActive
                              ? "text-[#D84315]"
                              : "text-[#1B1C1A] group-hover:text-[#D84315]"
                          )}
                        >
                          {childLabel}
                        </p>
                        <p className="mt-1 text-[11px] leading-relaxed text-gray-400">
                          {childDesc}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}
    </nav>
  )
}
