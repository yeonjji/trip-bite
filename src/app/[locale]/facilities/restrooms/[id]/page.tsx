import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  Users,
  ArrowLeft,
  MapPin,
  Clock,
  Phone,
  Building2,
  Navigation,
  Baby,
  Camera,
  Bell,
  Check,
  X,
} from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { cn } from "@/lib/utils";
import { getToiletById } from "@/lib/data/public-toilets";
import NaverMap from "@/components/maps/NaverMap";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="flex-shrink-0 w-6 h-6 rounded-md bg-[#14b8a6]/10 flex items-center justify-center text-[#0d9488] mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <dt className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
          {label}
        </dt>
        <dd className="text-sm text-foreground leading-snug">{value}</dd>
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const toilet = await getToiletById(id);
  return {
    title: toilet?.name ?? "공중화장실",
    description: toilet?.address_road ?? toilet?.address_jibun ?? "",
  };
}

export default async function RestroomDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const isKo = locale === "ko";

  const toilet = await getToiletById(id);
  if (!toilet) notFound();

  const lat = toilet.lat ?? null;
  const lng = toilet.lng ?? null;
  const hasLocation = lat !== null && lng !== null && lat !== 0 && lng !== 0;
  const address = toilet.address_road || toilet.address_jibun || "";

  const disabledTotal = (toilet.disabled_male ?? 0) + (toilet.disabled_female ?? 0);

  const amenities = [
    {
      key: "baby_care",
      active: toilet.baby_care,
      icon: <Baby className="w-4 h-4" />,
      labelKo: "기저귀교환대",
      labelEn: "Baby Care",
    },
    {
      key: "cctv",
      active: toilet.cctv,
      icon: <Camera className="w-4 h-4" />,
      labelKo: "CCTV",
      labelEn: "CCTV",
    },
    {
      key: "emergency_bell",
      active: toilet.emergency_bell,
      icon: <Bell className="w-4 h-4" />,
      labelKo: "비상벨",
      labelEn: "Emergency Bell",
    },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 pt-4 pb-12">
      {/* 뒤로가기 */}
      <Link
        href={`/${locale}/facilities/restrooms`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#0d9488] transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        {isKo ? "공중화장실" : "Public Restrooms"}
      </Link>

      {/* 히어로 */}
      <div className="bg-gradient-to-br from-[#14b8a6] to-[#0d9488] rounded-2xl p-5 text-white mb-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
            <Users className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold leading-snug">{toilet.name}</h1>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {toilet.baby_care && (
                <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-pink-400/30 text-white">
                  {isKo ? "기저귀교환대" : "Baby Care"}
                </span>
              )}
              {toilet.cctv && (
                <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white">
                  CCTV
                </span>
              )}
              {toilet.emergency_bell && (
                <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-400/30 text-white">
                  {isKo ? "비상벨" : "Emergency Bell"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-px mt-5 bg-white/20 rounded-xl overflow-hidden">
          <div className="text-center py-3 bg-white/10">
            <p className="text-2xl font-bold">{toilet.male_toilets ?? "-"}</p>
            <p className="text-[11px] text-white/70 mt-0.5">
              {isKo ? "남자 칸" : "Male"}
            </p>
          </div>
          <div className="text-center py-3 bg-white/10">
            <p className="text-2xl font-bold">{toilet.female_toilets ?? "-"}</p>
            <p className="text-[11px] text-white/70 mt-0.5">
              {isKo ? "여자 칸" : "Female"}
            </p>
          </div>
          <div className="text-center py-3 bg-white/10">
            <p className="text-2xl font-bold">{disabledTotal || "-"}</p>
            <p className="text-[11px] text-white/70 mt-0.5">
              {isKo ? "장애인 칸" : "Accessible"}
            </p>
          </div>
        </div>
      </div>

      {/* 지도 */}
      {hasLocation && (
        <div className="rounded-2xl border border-border overflow-hidden mb-4 h-52 relative">
          <NaverMap
            lat={lat!}
            lng={lng!}
            zoom={16}
            showMarker
            className="h-full w-full relative"
          />
        </div>
      )}

      {/* 시설 정보 */}
      <div className="bg-white rounded-2xl border border-border p-4 mb-4">
        <h2 className="text-sm font-bold text-foreground mb-3">
          {isKo ? "시설 정보" : "Amenities"}
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {amenities.map((a) => (
            <div
              key={a.key}
              className={cn(
                "flex flex-col items-center gap-1.5 py-3 rounded-xl border",
                a.active
                  ? "border-[#14b8a6]/30 bg-[#14b8a6]/5 text-[#0d9488]"
                  : "border-border bg-stone-50 text-stone-300"
              )}
            >
              {a.icon}
              <span className="text-[10px] font-semibold text-center leading-tight">
                {isKo ? a.labelKo : a.labelEn}
              </span>
              {a.active ? (
                <Check className="w-3 h-3" />
              ) : (
                <X className="w-3 h-3" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 이용 정보 */}
      <div className="bg-white rounded-2xl border border-border p-4 mb-4">
        <h2 className="text-sm font-bold text-foreground mb-3">
          {isKo ? "이용 정보" : "Details"}
        </h2>
        <dl className="flex flex-col gap-3">
          {address && (
            <InfoRow
              icon={<MapPin className="w-3.5 h-3.5" />}
              label={isKo ? "주소" : "Address"}
              value={address}
            />
          )}
          {toilet.open_time && (
            <InfoRow
              icon={<Clock className="w-3.5 h-3.5" />}
              label={isKo ? "이용시간" : "Hours"}
              value={toilet.open_time}
            />
          )}
          {toilet.open_time_detail && toilet.open_time_detail !== toilet.open_time && (
            <InfoRow
              icon={<Clock className="w-3.5 h-3.5" />}
              label={isKo ? "상세 운영시간" : "Hours Detail"}
              value={toilet.open_time_detail}
            />
          )}
          {toilet.manage_org && (
            <InfoRow
              icon={<Building2 className="w-3.5 h-3.5" />}
              label={isKo ? "관리기관" : "Managed By"}
              value={toilet.manage_org}
            />
          )}
          {toilet.phone && (
            <InfoRow
              icon={<Phone className="w-3.5 h-3.5" />}
              label={isKo ? "연락처" : "Phone"}
              value={toilet.phone}
            />
          )}
        </dl>
      </div>

      {/* 길찾기 버튼 */}
      {hasLocation && (
        <a
          href={`https://map.naver.com/v5/search/${encodeURIComponent(address || toilet.name)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[#14b8a6] hover:bg-[#0d9488] text-white font-semibold text-sm transition-colors"
        >
          <Navigation className="w-4 h-4" />
          {isKo ? "네이버 지도에서 길찾기" : "Get Directions on Naver Maps"}
        </a>
      )}
    </div>
  );
}
