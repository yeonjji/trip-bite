"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, Search } from "lucide-react"
import { LanguageSwitcher } from "./LanguageSwitcher"
import { MegaMenu } from "./MegaMenu"
import { MobileDrawer } from "./MobileDrawer"

type Props = { locale: string }

export function Header({ locale }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const isKo = locale === "ko"

  return (
    <>
      <header className="sticky top-0 z-50 h-16 w-full bg-[#FFFDF5]/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 md:px-6">
          {/* 로고 */}
          <Link href={`/${locale}`} className="shrink-0 transition-opacity hover:opacity-80">
            <Image
              src="/logo.svg"
              alt="TripBite"
              width={140}
              height={38}
              priority
            />
          </Link>

          {/* PC 메가메뉴 */}
          <MegaMenu locale={locale} isKo={isKo} />

          {/* 우측 액션 */}
          <div className="flex items-center gap-1">
            <Link
              href={`/${locale}/search`}
              aria-label="검색"
              className="rounded-full p-2 text-[#5A413A] transition-colors hover:bg-gray-100 hover:text-[#D84315]"
            >
              <Search size={20} />
            </Link>
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>
            {/* 햄버거 버튼 (모바일) */}
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

      <MobileDrawer
        locale={locale}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  )
}
