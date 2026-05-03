export type TravelCoursePlaceType = "travel" | "restaurant" | "festival" | "camping";
export type TravelCourseTripType = "dayTrip" | "overnight" | "twoNights";
export type TravelCourseStyle = "healing" | "food" | "camping" | "date" | "family" | "festival";

export interface TravelCoursePlace {
  id: string;
  type: TravelCoursePlaceType;
  name: string;
  region: string;
  lat: number;
  lng: number;
  tags: string[];
  popularityScore?: number;
  startDate?: string | Date;
  endDate?: string | Date;
  imageUrl?: string | null;
  address?: string | null;
  href?: string;
}

export interface TravelCourseDatasets {
  travelSpots: TravelCoursePlace[];
  restaurants: TravelCoursePlace[];
  campings: TravelCoursePlace[];
  festivals: TravelCoursePlace[];
}

export interface TravelCourseOptions {
  region: string;
  tripType: TravelCourseTripType;
  style: TravelCourseStyle;
  today?: Date;
  datasets: TravelCourseDatasets;
}

export interface TravelCourseStop {
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

interface CourseSlot {
  day?: 1 | 2 | 3;
  time: string;
  preferredTypes: TravelCoursePlaceType[];
}

const DAY_TRIP_SLOTS: CourseSlot[] = [
  { time: "10:00", preferredTypes: ["travel"] },
  { time: "12:30", preferredTypes: ["restaurant"] },
  { time: "14:30", preferredTypes: ["festival", "travel"] },
  { time: "18:00", preferredTypes: ["restaurant"] },
];

const OVERNIGHT_SLOTS: CourseSlot[] = [
  { day: 1, time: "10:00", preferredTypes: ["travel"] },
  { day: 1, time: "12:30", preferredTypes: ["restaurant"] },
  { day: 1, time: "14:30", preferredTypes: ["festival", "travel"] },
  { day: 1, time: "18:00", preferredTypes: ["restaurant"] },
  { day: 1, time: "20:00", preferredTypes: ["camping"] },
  { day: 2, time: "10:00", preferredTypes: ["travel"] },
  { day: 2, time: "12:30", preferredTypes: ["restaurant"] },
];

const TWO_NIGHTS_SLOTS: CourseSlot[] = [
  { day: 1, time: "10:00", preferredTypes: ["travel"] },
  { day: 1, time: "12:30", preferredTypes: ["restaurant"] },
  { day: 1, time: "14:30", preferredTypes: ["festival", "travel"] },
  { day: 1, time: "18:00", preferredTypes: ["restaurant"] },
  { day: 1, time: "20:00", preferredTypes: ["camping"] },
  { day: 2, time: "10:00", preferredTypes: ["travel"] },
  { day: 2, time: "12:30", preferredTypes: ["restaurant"] },
  { day: 2, time: "14:30", preferredTypes: ["festival", "travel"] },
  { day: 2, time: "18:00", preferredTypes: ["restaurant"] },
  { day: 2, time: "20:00", preferredTypes: ["camping"] },
  { day: 3, time: "10:00", preferredTypes: ["travel"] },
  { day: 3, time: "12:30", preferredTypes: ["restaurant"] },
];

export const STYLE_TAG_MAP: Record<TravelCourseStyle, string[]> = {
  healing: ["힐링", "자연", "바다", "산책", "숲", "호수", "공원", "휴식"],
  food: ["먹방", "맛집", "시장", "카페", "음식", "디저트", "전통음식"],
  camping: ["캠핑", "야영", "숲", "계곡", "글램핑", "카라반", "자연"],
  date: ["데이트", "카페", "야경", "전망", "해변", "산책", "사진"],
  family: ["가족", "아이", "체험", "공원", "박물관", "안전", "교육"],
  festival: ["축제", "공연", "행사", "문화", "체험", "시장"],
};

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function normalizeDate(value: string | Date) {
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  if (/^\d{8}$/.test(value)) {
    return new Date(Number(value.slice(0, 4)), Number(value.slice(4, 6)) - 1, Number(value.slice(6, 8)));
  }

  const parsed = new Date(value);
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

export function getDistanceKm(from: Pick<TravelCoursePlace, "lat" | "lng">, to: Pick<TravelCoursePlace, "lat" | "lng">) {
  const earthRadiusKm = 6371;
  const toRad = (degree: number) => (degree * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(earthRadiusKm * c * 10) / 10;
}

export function isActiveFestival(place: TravelCoursePlace, today = new Date()) {
  if (place.type !== "festival") return true;
  if (!place.startDate || !place.endDate) return false;

  const current = normalizeDate(today);
  return normalizeDate(place.startDate) <= current && current <= normalizeDate(place.endDate);
}

function getDistanceScore(distanceKm: number | null) {
  if (distanceKm === null) return 0;
  if (distanceKm <= 3) return 30;
  if (distanceKm <= 7) return 20;
  if (distanceKm <= 15) return 10;
  return -10;
}

function getStyleScore(place: TravelCoursePlace, style: TravelCourseStyle) {
  const preferredTags = STYLE_TAG_MAP[style].map(normalizeText);
  const placeTags = place.tags.map(normalizeText);
  return placeTags.some((tag) => preferredTags.some((preferred) => tag.includes(preferred) || preferred.includes(tag)))
    ? 20
    : 0;
}

export function scoreCandidate(
  place: TravelCoursePlace,
  previousPlace: TravelCoursePlace | null,
  style: TravelCourseStyle
) {
  const distanceKm = previousPlace ? getDistanceKm(previousPlace, place) : null;
  const score = getStyleScore(place, style) + (place.popularityScore ?? 0) + getDistanceScore(distanceKm);
  return { score, distanceKm };
}

function isSameRegion(placeRegion: string, selectedRegion: string) {
  const place = normalizeText(placeRegion);
  const selected = normalizeText(selectedRegion);
  return place === selected || place.includes(selected) || selected.includes(place);
}

function getPlaceKey(place: TravelCoursePlace) {
  return `${normalizeText(place.region)}:${normalizeText(place.name)}`;
}

function getPoolByType(datasets: TravelCourseDatasets, type: TravelCoursePlaceType) {
  if (type === "travel") return datasets.travelSpots;
  if (type === "restaurant") return datasets.restaurants;
  if (type === "camping") return datasets.campings;
  return datasets.festivals;
}

function selectBestPlace({
  datasets,
  preferredTypes,
  previousPlace,
  region,
  style,
  usedPlaceKeys,
  today,
}: {
  datasets: TravelCourseDatasets;
  preferredTypes: TravelCoursePlaceType[];
  previousPlace: TravelCoursePlace | null;
  region: string;
  style: TravelCourseStyle;
  usedPlaceKeys: Set<string>;
  today: Date;
}) {
  const candidates = preferredTypes.flatMap((type) => getPoolByType(datasets, type))
    .filter((place) => isSameRegion(place.region, region))
    .filter((place) => Number.isFinite(place.lat) && Number.isFinite(place.lng))
    .filter((place) => !usedPlaceKeys.has(getPlaceKey(place)))
    .filter((place) => isActiveFestival(place, today));

  if (candidates.length === 0) return null;

  return candidates
    .map((place) => ({ place, ...scoreCandidate(place, previousPlace, style) }))
    .sort((a, b) => b.score - a.score)[0];
}

export function generateTravelCourse({ region, tripType, style, today = new Date(), datasets }: TravelCourseOptions) {
  const slots =
    tripType === "twoNights"
      ? TWO_NIGHTS_SLOTS
      : tripType === "overnight"
        ? OVERNIGHT_SLOTS
        : DAY_TRIP_SLOTS;
  const usedPlaceKeys = new Set<string>();
  const stops: TravelCourseStop[] = [];
  let previousPlace: TravelCoursePlace | null = null;

  for (const slot of slots) {
    const selected = selectBestPlace({
      datasets,
      preferredTypes: style === "festival" && slot.preferredTypes.includes("festival")
        ? ["festival", ...slot.preferredTypes.filter((type) => type !== "festival")]
        : slot.preferredTypes,
      previousPlace,
      region,
      style,
      usedPlaceKeys,
      today,
    });

    if (!selected) continue;

    const { place, score, distanceKm } = selected;
    usedPlaceKeys.add(getPlaceKey(place));
    previousPlace = place;

    stops.push({
      day: slot.day,
      time: slot.time,
      type: place.type,
      id: place.id,
      name: place.name,
      region: place.region,
      lat: place.lat,
      lng: place.lng,
      tags: place.tags,
      score,
      distanceFromPreviousKm: distanceKm,
      imageUrl: place.imageUrl,
      address: place.address,
      href: place.href,
    });
  }

  return stops;
}
