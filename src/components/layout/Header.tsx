import Link from "next/link";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NavDropdown } from "./NavDropdown";

type Props = { locale: string };

export function Header({ locale }: Props) {
  const t = useTranslations("nav");

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
          <NavDropdown
            label={t("travel")}
            locale={locale}
            items={[
              { href: "/travel", label: t("allDestinations") },
              { href: "/travel/barrier-free", label: t("barrierFree") },
              { href: "/travel/pet", label: t("petFriendly") },
            ]}
          />
          <NavDropdown
            label={t("camping")}
            locale={locale}
            items={[
              { href: "/camping", label: t("allCamping") },
              { href: "/camping?induty=일반야영장", label: t("generalCamping") },
              { href: "/camping?induty=자동차야영장", label: t("carCamping") },
              { href: "/camping?induty=카라반", label: t("caravan") },
              { href: "/camping?induty=글램핑", label: t("glamping") },
            ]}
          />
          <Link
            href={`/${locale}/restaurants`}
            className="text-sm font-medium text-gray-700 hover:text-primary-500 transition-colors"
          >
            {t("restaurants")}
          </Link>
          <Link
            href={`/${locale}/recipes`}
            className="text-sm font-medium text-gray-700 hover:text-primary-500 transition-colors"
          >
            {t("recipes")}
          </Link>
          <Link
            href={`/${locale}/specialties`}
            className="text-sm font-medium text-gray-700 hover:text-primary-500 transition-colors"
          >
            {t("specialties")}
          </Link>
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
