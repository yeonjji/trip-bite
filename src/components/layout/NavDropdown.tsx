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
}

export function NavDropdown({ label, items, locale }: NavDropdownProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const ref = useRef<HTMLDivElement>(null)

  const isActive = items.some((item) =>
    pathname === `/${locale}${item.href}` ||
    pathname.startsWith(`/${locale}${item.href}/`)
  )

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
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        className={cn(
          "flex items-center gap-1 text-sm font-medium transition-colors",
          isActive ? "text-primary-500" : "text-gray-700 hover:text-primary-500"
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        {label}
        <ChevronDown
          size={14}
          className={cn("transition-transform duration-150", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 pt-2">
        <div
          role="menu"
          className="min-w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {items.map((item) => {
            const fullHref = `/${locale}${item.href}`
            const itemActive =
              pathname === fullHref || pathname.startsWith(fullHref + "/")
            return (
              <Link
                key={item.href}
                href={fullHref}
                role="menuitem"
                className={cn(
                  "block px-4 py-2 text-sm transition-colors hover:bg-gray-50",
                  itemActive
                    ? "font-medium text-primary-500"
                    : "text-gray-700"
                )}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
        </div>
      )}
    </div>
  )
}
