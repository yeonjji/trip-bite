import { Users } from "lucide-react";
import type { PublicToilet } from "@/lib/data/public-toilets";

interface ToiletCardProps {
  toilet: PublicToilet;
  locale: string;
}

export default function ToiletCard({ toilet, locale }: ToiletCardProps) {
  const isKo = locale === "ko";
  const address = toilet.address_road || toilet.address_jibun;

  return (
    <div className="flex items-start gap-4 p-4 rounded-2xl border border-border bg-white transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      {/* 아이콘 */}
      <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-[#14b8a6]/10 flex items-center justify-center border-l-4 border-[#14b8a6]">
        <Users className="w-6 h-6 text-[#0d9488]" />
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap mb-1">
          {/* 장애인 화장실 */}
          {((toilet.disabled_male ?? 0) > 0 || (toilet.disabled_female ?? 0) > 0) && (
            <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {isKo ? "장애인" : "Accessible"}
            </span>
          )}
          {/* 기저귀교환대 */}
          {toilet.baby_care && (
            <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-pink-100 text-pink-700">
              {isKo ? "기저귀교환대" : "Baby Care"}
            </span>
          )}
          {/* CCTV */}
          {toilet.cctv && (
            <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#14b8a6]/10 text-[#0d9488]">
              CCTV
            </span>
          )}
        </div>

        {/* 화장실명 */}
        <h3 className="font-bold text-[15px] leading-snug line-clamp-1 text-gray-900">
          {toilet.name}
        </h3>

        {/* 주소 */}
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{address}</p>

        {/* 운영시간 + 기관 */}
        <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
          {toilet.open_time && (
            <span className="font-medium text-[#0d9488]">{toilet.open_time}</span>
          )}
          {toilet.manage_org && (
            <>
              {toilet.open_time && <span>·</span>}
              <span className="line-clamp-1">{toilet.manage_org}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
