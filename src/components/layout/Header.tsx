import Link from "next/link";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NavDropdown } from "./NavDropdown";

type Props = { locale: string };

export function Header({ locale }: Props) {
  const t = useTranslations("nav");

  return (
    <header className="sticky top-0 z-50 h-16 w-full shadow-sm bg-[#FFFDF5]/80 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 md:px-6">
        <Link
          href={`/${locale}`}
          className="text-xl font-bold text-[#D84315] hover:text-[#B71C1C] transition-colors"
        >
          Trip Bite
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <NavDropdown
            label={t("travel")}
            locale={locale}
            items={[
              { href: "/travel", label: t("allDestinations") },
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
          <NavDropdown
            label={t("events")}
            locale={locale}
            items={[
              { href: "/events", label: t("allEvents") },
              { href: "/events?status=ongoing", label: t("ongoingEvents") },
              { href: "/events?status=upcoming", label: t("upcomingEvents") },
            ]}
          />
          <NavDropdown
            label={t("restaurants")}
            locale={locale}
            items={[
              { href: "/restaurants", label: t("allRestaurants") },
              { href: "/restaurants?cat3=A05020100", label: t("korean") },
              { href: "/restaurants?cat3=A05020200", label: t("western") },
              { href: "/restaurants?cat3=A05020300", label: t("japanese") },
              { href: "/restaurants?cat3=A05020400", label: t("chinese") },
              { href: "/restaurants?cat3=A05020900", label: t("cafe") },
            ]}
          />
          <Link
            href={`/${locale}/specialties`}
            className="text-sm font-medium text-[#5A413A] hover:text-[#D84315] transition-colors"
          >
            {t("specialties")}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/search`}
            aria-label="검색"
            className="p-2 text-[#5A413A] hover:text-[#D84315] transition-colors"
          >
            <Search size={20} />
          </Link>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
