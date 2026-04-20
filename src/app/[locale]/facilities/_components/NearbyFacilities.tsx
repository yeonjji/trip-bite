"use client";

import { useState, useCallback } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { haversineDistance } from "@/lib/utils/haversine";
import type { EvCharger } from "@/lib/data/ev-charging";
import EvChargingCard from "../ev-charging/_components/EvChargingCard";

type Status = "idle" | "requesting" | "granted" | "denied" | "error";

// 시도별 위경도 범위 (법정동 코드 기준)
const REGION_BOUNDS = [
  { zcode: "11", latMin: 37.42, latMax: 37.70, lngMin: 126.76, lngMax: 127.18 }, // 서울
  { zcode: "26", latMin: 35.02, latMax: 35.38, lngMin: 128.74, lngMax: 129.32 }, // 부산
  { zcode: "27", latMin: 35.78, latMax: 36.03, lngMin: 128.40, lngMax: 128.76 }, // 대구
  { zcode: "28", latMin: 37.34, latMax: 37.60, lngMin: 126.38, lngMax: 126.80 }, // 인천
  { zcode: "29", latMin: 35.07, latMax: 35.25, lngMin: 126.75, lngMax: 126.96 }, // 광주
  { zcode: "30", latMin: 36.24, latMax: 36.49, lngMin: 127.29, lngMax: 127.53 }, // 대전
  { zcode: "31", latMin: 35.47, latMax: 35.60, lngMin: 129.19, lngMax: 129.44 }, // 울산
  { zcode: "36110", latMin: 36.43, latMax: 36.57, lngMin: 127.21, lngMax: 127.33 }, // 세종
  { zcode: "41", latMin: 36.94, latMax: 37.87, lngMin: 126.61, lngMax: 127.82 }, // 경기
  { zcode: "51", latMin: 37.08, latMax: 38.61, lngMin: 127.73, lngMax: 129.38 }, // 강원
  { zcode: "43", latMin: 36.33, latMax: 37.17, lngMin: 127.43, lngMax: 128.52 }, // 충북
  { zcode: "44", latMin: 36.04, latMax: 37.00, lngMin: 126.24, lngMax: 127.56 }, // 충남
  { zcode: "52", latMin: 35.51, latMax: 36.07, lngMin: 126.43, lngMax: 127.79 }, // 전북
  { zcode: "46", latMin: 34.17, latMax: 35.41, lngMin: 126.16, lngMax: 127.78 }, // 전남
  { zcode: "47", latMin: 35.68, latMax: 37.10, lngMin: 128.27, lngMax: 129.59 }, // 경북
  { zcode: "48", latMin: 34.67, latMax: 35.74, lngMin: 127.65, lngMax: 129.25 }, // 경남
  { zcode: "50", latMin: 33.11, latMax: 33.57, lngMin: 126.14, lngMax: 126.99 }, // 제주
];

function deriveZcode(lat: number, lng: number): string {
  const match = REGION_BOUNDS.find(
    (r) => lat >= r.latMin && lat <= r.latMax && lng >= r.lngMin && lng <= r.lngMax
  );
  return match?.zcode ?? "11";
}

interface Props {
  locale: string;
}

export default function NearbyFacilities({ locale }: Props) {
  const isKo = locale === "ko";
  const [status, setStatus] = useState<Status>("idle");
  const [nearbyChargers, setNearbyChargers] = useState<Array<EvCharger & { distance: number }>>([]);

  const handleAllowLocation = useCallback(() => {
    setStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const zcode = deriveZcode(lat, lng);
        try {
          const res = await fetch(`/api/ev-chargers?zcode=${zcode}&pageSize=50`);
          const data: { items: EvCharger[] } = await res.json();
          const withDist = data.items
            .filter((c) => c.lat && c.lng)
            .map((c) => ({
              ...c,
              distance: haversineDistance(lat, lng, parseFloat(c.lat), parseFloat(c.lng)),
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 3);
          setNearbyChargers(withDist);
          setStatus("granted");
        } catch {
          setStatus("error");
        }
      },
      () => setStatus("denied")
    );
  }, []);

  return (
    <section className="mt-10">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-foreground">
          {isKo ? "내 주변 편의시설" : "Available Near You"}
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {isKo ? "현재 위치 기준 가까운 충전소" : "Nearest charging stations from your location"}
        </p>
      </div>

      {status === "idle" && (
        <div className="rounded-2xl border border-dashed border-[#14b8a6]/40 bg-[#14b8a6]/5 p-6 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-[#14b8a6]/10 flex items-center justify-center">
            <MapPin className="w-6 h-6 text-[#0d9488]" />
          </div>
          <p className="text-sm text-muted-foreground">
            {isKo
              ? "위치를 허용하면 주변 충전소를 찾아드립니다"
              : "Allow location to find nearby stations"}
          </p>
          <button
            onClick={handleAllowLocation}
            className="rounded-full bg-[#14b8a6] hover:bg-[#0d9488] text-white text-sm font-semibold px-5 py-2 transition-colors"
          >
            {isKo ? "위치 허용하기" : "Allow Location"}
          </button>
        </div>
      )}

      {status === "requesting" && (
        <div className="rounded-2xl border border-border bg-white p-8 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#14b8a6] animate-spin" />
          <p className="text-sm text-muted-foreground">
            {isKo ? "주변 시설을 찾는 중..." : "Finding nearby facilities..."}
          </p>
        </div>
      )}

      {status === "denied" && (
        <div className="rounded-2xl border border-border bg-white p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {isKo ? "위치 권한이 거부되었습니다." : "Location permission denied."}
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="rounded-2xl border border-border bg-white p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {isKo ? "데이터를 불러오지 못했습니다." : "Failed to load data."}
          </p>
        </div>
      )}

      {status === "granted" && nearbyChargers.length === 0 && (
        <div className="rounded-2xl border border-border bg-white p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {isKo ? "주변에 충전소가 없습니다." : "No charging stations nearby."}
          </p>
        </div>
      )}

      {status === "granted" && nearbyChargers.length > 0 && (
        <div className="flex flex-col gap-3">
          {nearbyChargers.map((charger) => (
            <EvChargingCard
              key={`${charger.statId}-${charger.chgerId}`}
              charger={charger}
              locale={locale}
              distance={charger.distance}
            />
          ))}
        </div>
      )}
    </section>
  );
}
