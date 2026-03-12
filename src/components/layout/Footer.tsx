import Link from "next/link";
import { useTranslations } from "next-intl";

type Props = { locale: string };

export function Footer({ locale }: Props) {
  const t = useTranslations("footer");

  return (
    <footer className="bg-gray-800 text-gray-400">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <p className="mb-3 text-sm font-semibold text-white">여행한입</p>
            <p className="text-xs leading-relaxed">대한민국의 맛과 멋을 한입에 담다</p>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold text-white">바로가기</p>
            <ul className="space-y-2 text-xs">
              <li><Link href={`/${locale}/travel`} className="hover:text-white transition-colors">여행지</Link></li>
              <li><Link href={`/${locale}/restaurants`} className="hover:text-white transition-colors">맛집</Link></li>
              <li><Link href={`/${locale}/camping`} className="hover:text-white transition-colors">캠핑장</Link></li>
              <li><Link href={`/${locale}/specialties`} className="hover:text-white transition-colors">특산품</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold text-white">{t("dataSource")}</p>
            <ul className="space-y-2 text-xs">
              <li>{t("tourApi")}</li>
              <li>{t("campingApi")}</li>
              <li>{t("recipeApi")}</li>
              <li>{t("weatherApi")}</li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold text-white">정보</p>
            <ul className="space-y-2 text-xs">
              <li><Link href={`/${locale}/about`} className="hover:text-white transition-colors">{t("about")}</Link></li>
              <li><Link href={`/${locale}/privacy`} className="hover:text-white transition-colors">{t("privacy")}</Link></li>
              <li><Link href={`/${locale}/terms`} className="hover:text-white transition-colors">{t("terms")}</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-700 pt-6 text-xs text-center">
          {t("copyright")}
        </div>
      </div>
    </footer>
  );
}
