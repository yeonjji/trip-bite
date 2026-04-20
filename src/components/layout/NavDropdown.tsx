"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { ChevronDown } from "lucide-react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export interface DropdownItem {
  href: string
  label: string
}

interface NavDropdownProps {
  label: string
  items: DropdownItem[]
  locale: string
  labelHref?: string  // 라벨 클릭 시 이동할 경로 (기본값: items[0].href)
}

export function NavDropdown({ label, items, locale, labelHref }: NavDropdownProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const ref = useRef<HTMLDivElement>(null)

  const getItemPath = (href: string) => href.split("?")[0]

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div
      ref={ref}
      className="relative pb-1"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div className="flex items-center gap-0.5">
        {items.length > 0 ? (
          <Link
            href={`/${locale}${labelHref ?? items[0].href}`}
            className="text-sm font-medium transition-colors text-gray-700 hover:text-primary-500"
          >
            {label}
          </Link>
        ) : (
          <span className="text-sm font-medium text-gray-700">{label}</span>
        )}
        {items.length > 0 && (
          <button
            className="flex items-center text-gray-700 hover:text-primary-500"
            aria-expanded={open}
            aria-haspopup="menu"
            onClick={() => setOpen((v) => !v)}
          >
            <ChevronDown
              size={14}
              className={cn("transition-transform duration-150", open && "rotate-180")}
            />
          </button>
        )}
      </div>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 min-w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {items.map((item) => {
            const fullHref = `/${locale}${item.href}`
            const itemPathOnly = `/${locale}${getItemPath(item.href)}`
            const itemActive =
              pathname === itemPathOnly || pathname.startsWith(itemPathOnly + "/")
            return (
              <Link
                key={item.href}
                href={fullHref}
                role="menuitem"
                className={cn(
                  "block px-4 py-2 text-sm transition-colors hover:bg-gray-50 hover:text-primary-500 text-gray-700",
                  itemActive && "font-medium"
                )}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
