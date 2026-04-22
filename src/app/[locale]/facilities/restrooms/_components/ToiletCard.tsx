import { Users } from "lucide-react";
import type { PublicToilet } from "@/lib/data/public-toilets";

interface ToiletCardProps {
  toilet: PublicToilet;
  locale: string;
}

export default function ToiletCard({ toilet, locale }: ToiletCardProps) {
  const isKo = locale === "ko";
  const address = toilet.address_road || toilet.address_jibun;
  const hasDisabled = (toilet.disabled_male ?? 0) > 0 || (toilet.disabled_female ?? 0) > 0;

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-white transition-all duration-150 hover:shadow-sm hover:border-[#14b8a6]/40 hover:bg-[#14b8a6]/[0.02] group">
      {/* 아이콘 */}
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#14b8a6]/10 flex items-center justify-center border-l-2 border-[#14b8a6]">
        <Users className="w-4.5 h-4.5 text-[#0d9488]" />
      </div>

      {/* 메인 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          {hasDisabled && (
            <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700">
              {isKo ? "장애인" : "Accessible"}
            </span>
          )}
          {toilet.baby_care && (
            <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-pink-100 text-pink-700">
              {isKo ? "기저귀교환대" : "Baby Care"}
            </span>
          )}
          {toilet.cctv && (
            <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-500">
              CCTV
            </span>
          )}
        </div>
        <p className="font-semibold text-sm leading-snug line-clamp-1 text-gray-900 group-hover:text-[#0d9488] transition-colors">
          {toilet.name}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{address}</p>
      </div>

      {/* 우측 보조 정보 */}
      <div className="flex-shrink-0 text-right">
        {toilet.open_time && (
          <p className="text-[11px] text-muted-foreground line-clamp-2 max-w-[90px]">{toilet.open_time}</p>
        )}
        {toilet.manage_org && (
          <p className="text-[11px] text-muted-foreground line-clamp-1 max-w-[90px]">{toilet.manage_org}</p>
        )}
      </div>
    </div>
  );
}
