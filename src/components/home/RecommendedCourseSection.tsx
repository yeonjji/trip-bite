"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Loader2, MapPin, Map, Route, Sparkles } from "lucide-react";
import CourseRouteMap from "@/components/home/CourseRouteMap";

type TravelCoursePlaceType = "travel" | "restaurant" | "festival" | "camping";
type TravelCourseTripType = "dayTrip" | "overnight" | "twoNights";
type TravelCourseStyle = "healing" | "food" | "camping" | "date" | "family" | "festival";

interface TravelCourseStop {
  day?: 1 | 2 | 3;
  time: string;
  type: TravelCoursePlaceType;
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  tags: string[];
  score: number;
  distanceFromPreviousKm: number | null;
  imageUrl?: string | null;
  address?: string | null;
  href?: string;
}

const REGION_PRESETS = ["강릉", "제주", "부산", "서울", "경주", "여수"];

const TRIP_TYPE_OPTIONS: Array<{ value: TravelCourseTripType; label: string }> = [
  { value: "dayTrip", label: "당일치기" },
  { value: "overnight", label: "1박2일" },
  { value: "twoNights", label: "2박3일" },
];

const STYLE_OPTIONS: Array<{ value: TravelCourseStyle; label: string }> = [
  { value: "healing", label: "힐링" },
  { value: "food", label: "먹방" },
  { value: "camping", label: "캠핑" },
  { value: "date", label: "데이트" },
  { value: "family", label: "가족" },
  { value: "festival", label: "축제" },
];

const TYPE_LABEL: Record<TravelCourseStop["type"], string> = {
  travel: "여행지",
  restaurant: "맛집",
  festival: "축제",
  camping: "숙박",
};

const TYPE_EMOJI: Record<TravelCourseStop["type"], string> = {
  travel: "📍",
  restaurant: "🍽️",
  festival: "🎊",
  camping: "⛺",
};

interface ApiResponse {
  course: TravelCourseStop[];
  meta?: {
    counts: Record<string, number>;
  };
  error?: string;
}

export default function RecommendedCourseSection({ locale }: { locale: string }) {
  const [region, setRegion] = useState("강릉");
  const [submittedRegion, setSubmittedRegion] = useState("강릉");
  const [tripType, setTripType] = useState<TravelCourseTripType>("dayTrip");
  const [style, setStyle] = useState<TravelCourseStyle>("healing");
  const [course, setCourse] = useState<TravelCourseStop[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [hasOpenedMap, setHasOpenedMap] = useState(false);
  const [courseKey, setCourseKey] = useState(0);

  const groupedCourse = useMemo(() => {
    return course.reduce<Record<string, TravelCourseStop[]>>((acc, stop) => {
      const key = stop.day ? `DAY ${stop.day}` : "추천 일정";
      acc[key] = [...(acc[key] ?? []), stop];
      return acc;
    }, {});
  }, [course]);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchCourse() {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        region: submittedRegion,
        tripType,
        style,
        locale,
      });

      try {
        const response = await fetch(`/api/travel-course?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as ApiResponse;

        if (!response.ok) {
          throw new Error(data.error ?? "추천 코스를 불러오지 못했습니다.");
        }

        setCourse(data.course ?? []);
        setCourseKey((k) => k + 1);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError((err as Error).message);
          setCourse([]);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchCourse();
    return () => controller.abort();
  }, [submittedRegion, tripType, style, locale]);

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-[#D84315]">
              <Sparkles className="h-3.5 w-3.5" /> 자동 추천
            </p>
            <h2 className="font-headline text-2xl font-bold text-[#1B1C1A]">
              나에게 맞는 여행 코스를 추천받아보세요
            </h2>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <div className="rounded-2xl border border-gray-100 bg-[#FFF8F5] p-5 warm-shadow">
            <label className="text-sm font-semibold text-[#1B1C1A]" htmlFor="course-region">
              지역
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="course-region"
                value={region}
                onChange={(event) => setRegion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && region.trim()) setSubmittedRegion(region.trim());
                }}
                placeholder="예: 강릉, 제주, 부산"
                className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#D84315]"
              />
              <button
                type="button"
                onClick={() => region.trim() && setSubmittedRegion(region.trim())}
                className="rounded-xl bg-[#D84315] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                생성
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {REGION_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setRegion(preset);
                    setSubmittedRegion(preset);
                  }}
                  className="rounded-full border border-[#D84315]/15 bg-white px-2.5 py-1 text-xs text-[#D84315] hover:bg-[#FFF3EF]"
                >
                  {preset}
                </button>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-[#1B1C1A]" htmlFor="course-trip-type">
                  여행 유형
                </label>
                <select
                  id="course-trip-type"
                  value={tripType}
                  onChange={(event) => setTripType(event.target.value as TravelCourseTripType)}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#D84315]"
                >
                  {TRIP_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-[#1B1C1A]" htmlFor="course-style">
                  여행 스타일
                </label>
                <select
                  id="course-style"
                  value={style}
                  onChange={(event) => setStyle(event.target.value as TravelCourseStyle)}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#D84315]"
                >
                  {STYLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 rounded-xl bg-white/70 p-3 text-xs leading-relaxed text-gray-500">
              <p className="font-semibold text-[#1B1C1A]">추천 기준</p>
              <p className="mt-1">스타일 태그 +20, 인기도 점수, 이전 장소와의 거리 점수를 합산합니다.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 warm-shadow">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#D84315]">{submittedRegion} 추천 코스</p>
                <h3 className="font-headline text-xl font-bold text-[#1B1C1A]">
                  {TRIP_TYPE_OPTIONS.find((option) => option.value === tripType)?.label} ·{" "}
                  {STYLE_OPTIONS.find((option) => option.value === style)?.label}
                </h3>
              </div>
              {course.length > 0 && !isLoading && (
                <button
                  type="button"
                  onClick={() => {
                    if (!hasOpenedMap) setHasOpenedMap(true);
                    setShowMap((v) => !v);
                  }}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[#D84315]/20 bg-[#FFF3EF] px-3 py-1.5 text-sm font-semibold text-[#D84315] transition-all hover:bg-[#D84315] hover:text-white"
                >
                  {showMap ? (
                    <>
                      <Route className="h-4 w-4" />
                      지도 접기
                    </>
                  ) : (
                    <>
                      <Map className="h-4 w-4" />
                      지도 보기
                    </>
                  )}
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="flex min-h-64 items-center justify-center rounded-2xl bg-[#FAFAF8] text-sm text-gray-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 코스를 생성하는 중입니다.
              </div>
            ) : error ? (
              <div className="rounded-2xl bg-red-50 p-5 text-sm text-red-600">{error}</div>
            ) : course.length === 0 ? (
              <div className="rounded-2xl bg-[#FAFAF8] p-5 text-sm text-gray-500">
                조건에 맞는 코스를 만들 데이터가 부족합니다. 지역명을 넓게 입력해보세요. 예: 강릉 → 강원
              </div>
            ) : (
              <>
                <div className="space-y-5">
                  {Object.entries(groupedCourse).map(([day, stops]) => (
                    <div key={day}>
                      <p className="mb-3 text-xs font-bold tracking-widest text-gray-400">{day}</p>
                      <div className="space-y-3">
                        {stops.map((stop, index) => {
                          const content = (
                            <div className="group flex gap-3 rounded-2xl border border-gray-100 bg-[#FAFAF8] p-4 transition-all hover:border-[#D84315]/30 hover:bg-white">
                              <div className="flex w-14 shrink-0 flex-col items-center">
                                <span className="text-sm font-bold text-[#1B1C1A]">{stop.time}</span>
                                {index < stops.length - 1 && <span className="mt-2 h-full min-h-8 w-px bg-gray-200" />}
                              </div>
                              <div className="flex min-w-0 flex-1 gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF3EF] text-lg">
                                  {TYPE_EMOJI[stop.type]}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-[#D84315]">
                                      {TYPE_LABEL[stop.type]}
                                    </span>
                                    {stop.distanceFromPreviousKm !== null && (
                                      <span className="text-[11px] text-gray-400">
                                        이전 장소에서 {stop.distanceFromPreviousKm}km
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-1 line-clamp-1 font-semibold text-[#1B1C1A]">{stop.name}</p>
                                  {stop.address && (
                                    <p className="mt-1 flex items-center gap-1 line-clamp-1 text-xs text-gray-400">
                                      <MapPin className="h-3 w-3" /> {stop.address}
                                    </p>
                                  )}
                                </div>
                                {stop.href && <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 group-hover:text-[#D84315]" />}
                              </div>
                            </div>
                          );

                          return stop.href ? (
                            <Link key={`${stop.type}-${stop.id}-${stop.time}`} href={stop.href}>
                              {content}
                            </Link>
                          ) : (
                            <div key={`${stop.type}-${stop.id}-${stop.time}`}>{content}</div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 지도 패널 — grid-rows 트릭으로 부드럽게 펼쳐짐 */}
                <div
                  className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${
                    showMap ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="min-h-0 overflow-hidden">
                    <div className="pt-5">
                      <div className="rounded-2xl border border-[#D84315]/10 bg-[#FFF8F5] p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <Route className="h-4 w-4 text-[#D84315]" />
                          <div>
                            <p className="text-sm font-bold text-[#1B1C1A]">추천 경로 지도</p>
                            <p className="text-xs text-gray-400">일정 순서대로 이동 경로를 확인해보세요</p>
                          </div>
                        </div>
                        {hasOpenedMap && (
                          <CourseRouteMap key={courseKey} stops={course} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
