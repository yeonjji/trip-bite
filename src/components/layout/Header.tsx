import Link from "next/link";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";

type Props = { locale: string };

export function Header({ locale }: Props) {
  const t = useTranslations("nav");

  const navLinks = [
    { href: `/${locale}/travel`, label: t("travel") },
    { href: `/${locale}/restaurants`, label: t("restaurants") },
    { href: `/${locale}/specialties`, label: t("specialties") },
    { href: `/${locale}/recipes`, label: t("recipes") },
  ];

  return (
    <header className="sticky top-0 z-50 h-16 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 md:px-6">
        <Link
          href={`/${locale}`}
          className="text-xl font-bold text-primary-500 hover:text-primary-600 transition-colors"
        >
          여행한입
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-700 hover:text-primary-500 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/search`}
            aria-label="검색"
            className="p-2 text-gray-600 hover:text-primary-500 transition-colors"
          >
            <Search size={20} />
          </Link>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
