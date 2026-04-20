import Link from "next/link";
import { Wifi, ArrowLeft, Clock } from "lucide-react";
import { setRequestLocale } from "next-intl/server";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function WifiPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isKo = locale === "ko";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href={`/${locale}/facilities`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#0d9488] transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {isKo ? "편의시설로 돌아가기" : "Back to Facilities"}
      </Link>

      <div className="rounded-2xl border border-border bg-white p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#14b8a6]/10 flex items-center justify-center mx-auto mb-4">
          <Wifi className="w-8 h-8 text-[#0d9488]" />
        </div>
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold bg-stone-100 text-stone-500 px-3 py-1 rounded-full mb-3">
          <Clock className="w-3 h-3" />
          {isKo ? "준비중" : "Coming Soon"}
        </div>
        <h1 className="text-2xl font-bold mb-2">{isKo ? "공용 와이파이" : "Public Wi-Fi"}</h1>
        <p className="text-muted-foreground text-sm">
          {isKo
            ? "곧 서비스될 예정이에요. 조금만 기다려 주세요!"
            : "This feature will be available soon. Stay tuned!"}
        </p>
      </div>
    </div>
  );
}
