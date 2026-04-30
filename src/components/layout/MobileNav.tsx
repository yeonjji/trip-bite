"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Home, Map, UtensilsCrossed, Search, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();

  const tabs = [
    { href: `/${locale}`,              label: t("home"),        icon: Home },
    { href: `/${locale}/travel`,       label: t("travel"),      icon: Map },
    { href: `/${locale}/restaurants`,  label: t("restaurants"), icon: UtensilsCrossed },
    { href: `/${locale}/recipes`,      label: t("recipes"),     icon: BookOpen },
    { href: `/${locale}/search`,       label: t("search"),      icon: Search },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-14 items-center border-t border-gray-200 bg-white md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {tabs.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
              isActive ? "text-primary-500" : "text-gray-500 hover:text-gray-800"
            )}
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
