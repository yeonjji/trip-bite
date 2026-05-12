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
  PersonStanding,
} from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import ShareButton from "@/components/shared/ShareButton";
import { cn } from "@/lib/utils";
import { getToiletById } from "@/lib/data/public-toilets";
import { getNearbyTourRecommendations, getNearbyFoodItems } from "@/lib/data/nearby-tour-recommendations";
import NaverMap from "@/components/maps/NaverMap";
import FacilityNearbySections from "@/components/nearby/FacilityNearbySection";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <dt className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
          {label}
        </dt>
        <dd className="text-sm text-foreground leading-snug mt-0.5">{value}</dd>
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

  const tourTabOrder = ["travel", "festival", "accommodation"] as const;
  const [restaurantItems, cafeItems, tourRecs] = hasLocation
    ? await Promise.all([
        getNearbyFoodItems({ lat: lat!, lng: lng!, type: "restaurant", limit: 8 }),
        getNearbyFoodItems({ lat: lat!, lng: lng!, type: "cafe", limit: 8 }),
        getNearbyTourRecommendations({ lat: lat!, lng: lng!, types: [...tourTabOrder], limitPerType: 6 }),
      ])
    : [[], [], { travel: [], festival: [], accommodation: [], restaurant: [], cafe: [] }];
  const address = toilet.address_road || toilet.address_jibun || "";
  const disabledTotal = (toilet.disabled_male ?? 0) + (toilet.disabled_female ?? 0);

  const amenities = [
    {
      key: "baby_care",
      active: toilet.baby_care,
      icon: <Baby className="w-5 h-5" />,
      labelKo: "기저귀교환대",
      labelEn: "Baby Care",
    },
    {
      key: "cctv",
      active: toilet.cctv,
      icon: <Camera className="w-5 h-5" />,
      labelKo: "CCTV",
      labelEn: "CCTV",
    },
    {
      key: "emergency_bell",
      active: toilet.emergency_bell,
      icon: <Bell className="w-5 h-5" />,
      labelKo: "비상벨",
      labelEn: "Emergency Bell",
    },
  ];

  const stallTypes = [
    {
      label: isKo ? "남자 칸" : "Male",
      count: toilet.male_toilets ?? 0,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
    },
    {
      label: isKo ? "여자 칸" : "Female",
      count: toilet.female_toilets ?? 0,
      color: "text-pink-600",
      bg: "bg-pink-50",
      border: "border-pink-100",
    },
    {
      label: isKo ? "장애인 칸" : "Accessible",
      count: disabledTotal,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-100",
    },
  ];

  return (
    <div className="bg-[#F9F7F0] min-h-screen">
      <div className="mx-auto max-w-6xl px-4 pt-6 pb-16">

        {/* 뒤로가기 */}
        <Link
          href={`/${locale}/facilities/restrooms`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-orange-700 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {isKo ? "공중화장실" : "Public Restrooms"}
        </Link>

        {/* 히어로 배너 */}
        <div className="relative h-[180px] md:h-[280px] rounded-2xl overflow-hidden mb-4 md:mb-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700">
          <div className="absolute right-6 md:right-8 inset-y-0 flex items-center">
            <Users className="w-20 h-20 md:w-48 md:h-48 text-white/[0.03] md:text-white/5" strokeWidth={1} />
          </div>
          <div className="absolute inset-0 flex flex-col justify-center md:justify-end p-4 md:p-8">
            <div className="flex flex-wrap gap-1.5 md:gap-2 mb-1.5 md:mb-3">
              {toilet.baby_care && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-pink-500/80 text-white">
                  <Baby className="w-3 h-3" />
                  {isKo ? "기저귀교환대" : "Baby Care"}
                </span>
              )}
              {toilet.cctv && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-slate-600/80 text-slate-200">
                  <Camera className="w-3 h-3" />
                  CCTV
                </span>
              )}
              {toilet.emergency_bell && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-orange-500/80 text-white">
                  <Bell className="w-3 h-3" />
                  {isKo ? "비상벨" : "Emergency Bell"}
                </span>
              )}
            </div>
            <h1 className="text-lg md:text-2xl font-bold text-white leading-snug">{toilet.name}</h1>
            {address && (
              <p className="text-xs md:text-sm text-slate-300 mt-0.5 md:mt-1 line-clamp-1">{address}</p>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          {[
            {
              icon: <Users className="w-5 h-5" />,
              label: isKo ? "남자 칸" : "Male Stalls",
              value: String(toilet.male_toilets ?? "-"),
            },
            {
              icon: <Users className="w-5 h-5" />,
              label: isKo ? "여자 칸" : "Female Stalls",
              value: String(toilet.female_toilets ?? "-"),
            },
            {
              icon: <PersonStanding className="w-5 h-5" />,
              label: isKo ? "장애인 칸" : "Accessible",
              value: disabledTotal > 0 ? String(disabledTotal) : "-",
            },
            {
              icon: <Baby className="w-5 h-5" />,
              label: isKo ? "기저귀교환대" : "Baby Care",
              value: toilet.baby_care ? (isKo ? "있음" : "Yes") : (isKo ? "없음" : "No"),
            },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-zinc-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                {stat.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{stat.label}</p>
                <p className="text-lg font-bold text-slate-800">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 2컬럼 메인 레이아웃 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* 왼쪽: 칸 수 현황 + 편의시설 */}
          <div className="lg:col-span-2">
            {/* 칸 수 현황 */}
            <h2 className="text-base font-bold text-slate-800 mb-4">
              {isKo ? "칸 수 현황" : "Stall Count"}
            </h2>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {stallTypes.map((stall) => (
                <div
                  key={stall.label}
                  className={cn(
                    "bg-white rounded-2xl border p-6 shadow-sm text-center",
                    stall.border
                  )}
                >
                  <div className={cn("w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center", stall.bg, stall.color)}>
                    <Users className="w-6 h-6" />
                  </div>
                  <p className={cn("text-3xl font-bold", stall.color)}>
                    {stall.count > 0 ? stall.count : "-"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{stall.label}</p>
                </div>
              ))}
            </div>

            {/* 편의시설 */}
            <h2 className="text-base font-bold text-slate-800 mb-4">
              {isKo ? "편의시설" : "Amenities"}
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {amenities.map((a) => (
                <div
                  key={a.key}
                  className={cn(
                    "bg-white rounded-2xl border p-6 shadow-sm text-center",
                    a.active ? "border-orange-100" : "border-zinc-100"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center",
                    a.active ? "bg-orange-50 text-orange-600" : "bg-slate-50 text-slate-300"
                  )}>
                    {a.icon}
                  </div>
                  <p className={cn(
                    "text-xs font-semibold",
                    a.active ? "text-slate-700" : "text-slate-400"
                  )}>
                    {isKo ? a.labelKo : a.labelEn}
                  </p>
                  <div className={cn(
                    "mt-2 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full",
                    a.active
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-400"
                  )}>
                    {a.active
                      ? <><Check className="w-2.5 h-2.5" />{isKo ? "있음" : "Yes"}</>
                      : <><X className="w-2.5 h-2.5" />{isKo ? "없음" : "No"}</>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 오른쪽: 이용정보 + 지도 + 길찾기 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6 mb-4">
              <h2 className="text-base font-bold text-slate-800 mb-5">
                {isKo ? "이용 정보" : "Details"}
              </h2>
              <dl className="flex flex-col gap-4">
                {address && (
                  <InfoRow
                    icon={<MapPin className="w-4 h-4" />}
                    label={isKo ? "주소" : "Address"}
                    value={address}
                  />
                )}
                {toilet.open_time && (
                  <InfoRow
                    icon={<Clock className="w-4 h-4" />}
                    label={isKo ? "이용시간" : "Hours"}
                    value={toilet.open_time}
                  />
                )}
                {toilet.open_time_detail && toilet.open_time_detail !== toilet.open_time && (
                  <InfoRow
                    icon={<Clock className="w-4 h-4" />}
                    label={isKo ? "상세 운영시간" : "Hours Detail"}
                    value={toilet.open_time_detail}
                  />
                )}
                {toilet.manage_org && (
                  <InfoRow
                    icon={<Building2 className="w-4 h-4" />}
                    label={isKo ? "관리기관" : "Managed By"}
                    value={toilet.manage_org}
                  />
                )}
                {toilet.phone && (
                  <InfoRow
                    icon={<Phone className="w-4 h-4" />}
                    label={isKo ? "연락처" : "Phone"}
                    value={toilet.phone}
                  />
                )}
              </dl>
            </div>

            {hasLocation && (
              <div className="h-48 rounded-xl overflow-hidden border border-zinc-200 mb-4 relative">
                <NaverMap lat={lat!} lng={lng!} zoom={16} showMarker className="h-full w-full relative" />
              </div>
            )}

            {hasLocation && (
              <a
                href={`https://map.naver.com/v5/search/${encodeURIComponent(address || toilet.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-slate-900 hover:bg-orange-600 text-white font-semibold text-sm transition-colors"
              >
                <Navigation className="w-4 h-4" />
                {isKo ? "네이버 지도에서 길찾기" : "Get Directions on Naver Maps"}
              </a>
            )}
            <div className="mt-3">
              <ShareButton
                title={toilet.name}
                isKo={isKo}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-[#5A413A] transition hover:border-[#D84315] hover:text-[#D84315]"
              />
            </div>
          </div>
        </div>

        {hasLocation && (
          <FacilityNearbySections
            restaurants={restaurantItems}
            cafes={cafeItems}
            tourRecs={tourRecs}
            tourTabOrder={[...tourTabOrder]}
            locale={locale}
          />
        )}
      </div>
    </div>
  );
}
