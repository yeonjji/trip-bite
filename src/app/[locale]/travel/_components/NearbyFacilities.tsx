"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users, Wifi, ParkingCircle, Zap,
  MapPin, Baby, ChevronRight, BatteryCharging,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceM } from "@/lib/utils/haversine";
import type {
  NearbyToilet,
  NearbyWifi,
  NearbyParking,
  NearbyEvStation,
} from "@/lib/data/nearby-facilities";

interface Props {
  locale: string;
  toilets: NearbyToilet[];
  wifi: NearbyWifi[];
  parking: NearbyParking[];
  evStations: NearbyEvStation[];
  lat?: number | null;
  lng?: number | null;
}

function formatHhmm(hhmm: string | null): string {
  if (!hhmm || hhmm.length < 4) return "";
  return `${hhmm.slice(0, 2)}:${hhmm.slice(2, 4)}`;
}

export default function NearbyFacilities({
  locale, toilets, wifi, parking, evStations, lat, lng,
}: Props) {
  const isKo = locale === "ko";

  const tabs = [
    {
      key: "toilet",
      label: isKo ? "화장실" : "Restrooms",
      icon: <Users className="w-4 h-4" />,
      count: toilets.length,
    },
    {
      key: "wifi",
      label: isKo ? "와이파이" : "WiFi",
      icon: <Wifi className="w-4 h-4" />,
      count: wifi.length,
    },
    {
      key: "parking",
      label: isKo ? "주차장" : "Parking",
      icon: <ParkingCircle className="w-4 h-4" />,
      count: parking.length,
    },
    {
      key: "ev",
      label: isKo ? "전기차 충전" : "EV Charging",
      icon: <Zap className="w-4 h-4" />,
      count: evStations.length,
    },
  ];

  // 데이터가 있는 첫 번째 탭을 기본 선택
  const firstWithData = tabs.find((t) => t.count > 0)?.key ?? "toilet";
  const [active, setActive] = useState(firstWithData);

  const totalCount = toilets.length + wifi.length + parking.length + evStations.length;

  useEffect(() => {
    const coordInfo = (lat != null && lng != null)
      ? `좌표: lat=${lat}, lng=${lng} (10km 반경 조회)`
      : "좌표 없음 → DB 조회 자체를 하지 않음";

    if (totalCount === 0) {
      console.log(`[주변 시설] 정보가 없습니다 (화장실:0 / 와이파이:0 / 주차장:0 / 전기차충전:0) | ${coordInfo}`);
    } else {
      console.log(
        `[주변 시설] 정보가 있습니다 — 화장실:${toilets.length} / 와이파이:${wifi.length} / 주차장:${parking.length} / 전기차충전:${evStations.length} | ${coordInfo}`
      );
    }
  }, [totalCount, toilets.length, wifi.length, parking.length, evStations.length, lat, lng]);

  if (totalCount === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-baseline gap-2 mb-4">
        <h2 className="font-headline text-xl font-bold text-[#1B1C1A]">
          {isKo ? "주변 시설" : "Nearby Facilities"}
        </h2>
        <span className="text-xs text-muted-foreground">
          {isKo ? "10km 이내" : "within 10km"}
        </span>
      </div>

      {/* 탭 버튼 */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            disabled={tab.count === 0}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
              active === tab.key
                ? "bg-primary text-primary-foreground"
                : tab.count === 0
                  ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                  : "bg-[#F9F7EF] text-[#5A413A] hover:bg-[#FFEDE7] hover:text-[#D84315]"
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.count > 0 && (
              <span className={cn(
                "inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold",
                active === tab.key ? "bg-white/30 text-white" : "bg-slate-200 text-slate-600"
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div className="flex flex-col gap-2">

        {/* 공중화장실 */}
        {active === "toilet" && toilets.map((t) => (
          <Link
            key={t.id}
            href={`/${locale}/facilities/restrooms/${t.id}`}
            className="flex items-center gap-3 bg-[#F9F7EF] rounded-xl px-4 py-3 hover:bg-[#FFEDE7] transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0 text-orange-600 shadow-sm">
              <Users className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#1B1C1A] truncate">{t.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {t.address_road || t.address_jibun || "-"}
                </span>
                {t.baby_care && (
                  <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-pink-100 text-pink-700">
                    <Baby className="w-2.5 h-2.5" />
                    {isKo ? "기저귀" : "Baby"}
                  </span>
                )}
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                {formatDistanceM(t.distance_m)}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-500 transition-colors" />
            </div>
          </Link>
        ))}

        {/* 와이파이 */}
        {active === "wifi" && wifi.map((w) => (
          <Link
            key={w.id}
            href={`/${locale}/facilities/wifi/${w.id}`}
            className="flex items-center gap-3 bg-[#F9F7EF] rounded-xl px-4 py-3 hover:bg-[#FFEDE7] transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0 text-blue-600 shadow-sm">
              <Wifi className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#1B1C1A] truncate">{w.place_name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {w.ssid ? (
                  <span className="text-xs text-blue-600 font-mono font-semibold truncate">{w.ssid}</span>
                ) : (
                  <span className="text-xs text-muted-foreground truncate">
                    {w.facility_type || w.provider || "-"}
                  </span>
                )}
                {w.provider && (
                  <span className="shrink-0 text-[10px] text-muted-foreground">{w.provider}</span>
                )}
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                {formatDistanceM(w.distance_m)}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-500 transition-colors" />
            </div>
          </Link>
        ))}

        {/* 주차장 */}
        {active === "parking" && parking.map((p) => {
          const isFree = p.fee_type === "무료";
          const open = formatHhmm(p.weekday_open);
          const close = formatHhmm(p.weekday_close);
          return (
            <Link
              key={p.id}
              href={`/${locale}/facilities/parking/${p.id}`}
              className="flex items-center gap-3 bg-[#F9F7EF] rounded-xl px-4 py-3 hover:bg-[#FFEDE7] transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0 text-orange-600 shadow-sm">
                <ParkingCircle className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-[#1B1C1A] truncate">{p.name}</p>
                  <span className={cn(
                    "shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded",
                    isFree ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                  )}>
                    {isKo ? (isFree ? "무료" : "유료") : (isFree ? "Free" : "Paid")}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                  {p.capacity && (
                    <span>{isKo ? `${p.capacity}면` : `${p.capacity} spots`}</span>
                  )}
                  {open && close && (
                    <span>{open}–{close}</span>
                  )}
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                  {formatDistanceM(p.distance_m)}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-500 transition-colors" />
              </div>
            </Link>
          );
        })}

        {/* 전기차 충전소 */}
        {active === "ev" && evStations.map((s) => (
          <Link
            key={s.stat_id}
            href={`/${locale}/facilities/ev-charging/${s.stat_id}`}
            className="flex items-center gap-3 bg-[#F9F7EF] rounded-xl px-4 py-3 hover:bg-[#FFEDE7] transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0 text-orange-600 shadow-sm">
              <Zap className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-[#1B1C1A] truncate">{s.stat_nm}</p>
                {s.has_fast && (
                  <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">
                    <Zap className="w-2.5 h-2.5" />{isKo ? "급속" : "Fast"}
                  </span>
                )}
                {s.has_slow && !s.has_fast && (
                  <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                    <BatteryCharging className="w-2.5 h-2.5" />{isKo ? "완속" : "Slow"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                <span>{isKo ? `충전기 ${s.charger_count}대` : `${s.charger_count} chargers`}</span>
                {s.max_output && (
                  <span className="text-orange-600 font-semibold">{s.max_output}kW</span>
                )}
                {s.parking_free === "Y" && (
                  <span className="text-green-600">{isKo ? "주차무료" : "Free parking"}</span>
                )}
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                {formatDistanceM(s.distance_m)}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-500 transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
