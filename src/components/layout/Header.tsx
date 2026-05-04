"use client"

import { useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Menu, Search } from "lucide-react"
import { LanguageSwitcher } from "./LanguageSwitcher"
import { NavDropdown } from "./NavDropdown"
import { MobileDrawer } from "./MobileDrawer"
import { NAV_ITEMS } from "@/lib/constants/nav-items"

type Props = { locale: string }

export function Header({ locale }: Props) {
  const t = useTranslations("nav")
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-50 h-16 w-full bg-[#FFFDF5]/80 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 md:px-6">
          {/* 로고 */}
          <Link
            href={`/${locale}`}
            className="text-xl font-bold text-[#D84315] transition-colors hover:text-[#B71C1C]"
          >
            Trip Bite
          </Link>

          {/* PC 네비게이션 (md 이상) */}
          <nav className="hidden items-center gap-6 md:flex">
            {NAV_ITEMS.map((item) =>
              item.children.length > 0 ? (
                <NavDropdown
                  key={item.labelKey}
                  label={t(item.labelKey as any)}
                  locale={locale}
                  labelHref={item.href}
                  items={item.children.map((c) => ({
                    href: c.href,
                    label: t(c.labelKey as any),
                  }))}
                />
              ) : (
                <Link
                  key={item.labelKey}
                  href={`/${locale}${item.href}`}
                  className="text-sm font-medium text-[#5A413A] transition-colors hover:text-[#D84315]"
                >
                  {t(item.labelKey as any)}
                </Link>
              )
            )}
          </nav>

          {/* 우측 액션 */}
          <div className="flex items-center gap-1">
            <Link
              href={`/${locale}/search`}
              aria-label="검색"
              className="p-2 text-[#5A413A] transition-colors hover:text-[#D84315]"
            >
              <Search size={20} />
            </Link>
            {/* 언어 전환: PC에서만 표시 */}
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>
            {/* 햄버거 버튼: 모바일에서만 표시 */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="rounded-xl p-2 text-[#5A413A] transition-colors hover:bg-[#FFF3EF] hover:text-[#D84315] md:hidden"
              aria-label="메뉴 열기"
              aria-expanded={drawerOpen}
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* 모바일 드로어 */}
      <MobileDrawer
        locale={locale}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  )
}
