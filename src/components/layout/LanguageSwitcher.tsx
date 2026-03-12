"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { routing } from "@/i18n/routing";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(next: string) {
    // 현재 경로에서 locale prefix 교체
    const segments = pathname.split("/");
    segments[1] = next;
    router.push(segments.join("/"));
  }

  return (
    <div className="flex items-center gap-1 text-sm font-medium">
      {routing.locales.map((l, i) => (
        <span key={l} className="flex items-center">
          {i > 0 && <span className="mx-1 text-gray-300">|</span>}
          <button
            onClick={() => switchLocale(l)}
            className={
              l === locale
                ? "text-primary-500 font-semibold"
                : "text-gray-500 hover:text-gray-800 transition-colors"
            }
            aria-label={l === "ko" ? "한국어로 전환" : "Switch to English"}
          >
            {l.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  );
}
