import Link from "next/link";
import { Users, MapPin, Clock, ChevronRight } from "lucide-react";
import type { PublicToilet } from "@/lib/data/public-toilets";

interface ToiletCardProps {
  toilet: PublicToilet;
  locale: string;
}

export default function ToiletCard({ toilet, locale }: ToiletCardProps) {
  const isKo = locale === "ko";
  const address = toilet.address_road || toilet.address_jibun;
  const hasDisabled = (toilet.disabled_male ?? 0) > 0 || (toilet.disabled_female ?? 0) > 0;
  const totalToilets = (toilet.male_toilets ?? 0) + (toilet.female_toilets ?? 0);

  return (
    <Link
      href={`/${locale}/facilities/restrooms/${toilet.id}`}
      className="block bg-white rounded-xl p-4 md:p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-transparent hover:shadow-[0px_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="flex items-center justify-between gap-3 md:gap-6">
        {/* 아이콘 */}
        <div className="shrink-0 w-10 h-10 md:w-14 md:h-14 bg-[#F9F7F0] rounded-xl flex items-center justify-center text-primary">
          <Users className="w-5 h-5 md:w-7 md:h-7" />
        </div>

        {/* 중앙 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="font-semibold text-sm md:text-base text-gray-900 line-clamp-1">
              {toilet.name}
            </span>
            {hasDisabled && (
              <span className="inline-flex items-center text-[10px] font-black px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 tracking-tight uppercase">
                {isKo ? "장애인" : "Accessible"}
              </span>
            )}
            {toilet.baby_care && (
              <span className="inline-flex items-center text-[10px] font-black px-1.5 py-0.5 rounded bg-pink-100 text-pink-700 tracking-tight uppercase">
                {isKo ? "기저귀" : "Baby"}
              </span>
            )}
            {toilet.cctv && (
              <span className="inline-flex items-center text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 tracking-tight uppercase">
                CCTV
              </span>
            )}
          </div>
          <div className="flex flex-col gap-0.5 md:flex-row md:items-center md:gap-4">
            <span className="flex items-center gap-1 min-w-0 text-xs md:text-sm text-slate-500">
              <MapPin className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0 text-teal-600" />
              <span className="truncate">{address}</span>
            </span>
            {toilet.open_time && (
              <span className="flex items-center gap-1 shrink-0 text-xs text-slate-400">
                <Clock className="w-3 h-3 text-slate-400" />
                {toilet.open_time}
              </span>
            )}
          </div>
        </div>

        {/* 칸 수 */}
        <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
          {totalToilets > 0 && (
            <div className="text-center min-w-[40px] md:min-w-[72px]">
              <p className="hidden md:block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                {isKo ? "화장실" : "Stalls"}
              </p>
              <p className="text-base md:text-2xl font-bold text-teal-600 leading-none">
                {totalToilets}
              </p>
            </div>
          )}
          <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-300 shrink-0" />
        </div>
      </div>
    </Link>
  );
}
