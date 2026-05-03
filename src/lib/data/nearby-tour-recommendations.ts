import { tourApi } from "@/lib/api/tour-api";
import type { TourSpotBase } from "@/types/tour-api";

export type NearbyTourType = "travel" | "festival" | "accommodation";

export interface NearbyTourItem {
  id: string;
  contentId: string;
  title: string;
  type: NearbyTourType;
  address: string;
  image: string;
  lat: number;
  lng: number;
  distance: number;
}

export type NearbyTourRecommendations = Record<NearbyTourType, NearbyTourItem[]>;

const CONTENT_TYPE_BY_NEARBY_TYPE: Record<NearbyTourType, string> = {
  travel: "12",
  festival: "15",
  accommodation: "32",
};

export const NEARBY_TOUR_PLACEHOLDER_IMAGE = "/file.svg";

const DEFAULT_RADIUS_METERS = 15_000;
const FETCH_POOL_SIZE = 30;

function toArray<T>(value: T[] | T | undefined | null): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function toNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function calculateDistanceKm(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): number {
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

export function normalizeNearbyTourItem(
  item: TourSpotBase,
  type: NearbyTourType,
  origin: { lat: number; lng: number }
): NearbyTourItem | null {
  const lat = toNumber(item.mapy);
  const lng = toNumber(item.mapx);
  const contentId = item.contentid ? String(item.contentid) : "";
  const title = item.title?.trim() ?? "";

  if (!contentId || !title || lat === null || lng === null) return null;

  return {
    id: `${type}-${contentId}`,
    contentId,
    title,
    type,
    address: [item.addr1, item.addr2].filter(Boolean).join(" "),
    image: item.firstimage || item.firstimage2 || NEARBY_TOUR_PLACEHOLDER_IMAGE,
    lat,
    lng,
    distance: calculateDistanceKm(origin, { lat, lng }),
  };
}

export async function getNearbyTourItems({
  lat,
  lng,
  type,
  excludeContentId,
  limit = 5,
  radiusMeters = DEFAULT_RADIUS_METERS,
}: {
  lat: number;
  lng: number;
  type: NearbyTourType;
  excludeContentId?: string | null;
  limit?: number;
  radiusMeters?: number;
}): Promise<NearbyTourItem[]> {
  try {
    const response = await tourApi.locationBasedList({
      mapX: lng,
      mapY: lat,
      radius: radiusMeters,
      contentTypeId: CONTENT_TYPE_BY_NEARBY_TYPE[type],
      arrange: "E",
      pageNo: 1,
      numOfRows: FETCH_POOL_SIZE,
    });

    const rawItems = response.response.body.items === ""
      ? []
      : toArray(response.response.body.items.item);

    return rawItems
      .filter((item) => String(item.contentid) !== String(excludeContentId ?? ""))
      .map((item) => normalizeNearbyTourItem(item, type, { lat, lng }))
      .filter((item): item is NearbyTourItem => item !== null)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);
  } catch (error) {
    console.error(`nearby ${type} fetch error:`, error instanceof Error ? error.message : error);
    return [];
  }
}

export async function getNearbyTourRecommendations({
  lat,
  lng,
  excludeContentId,
  types = ["travel", "festival", "accommodation"],
  limitPerType = 5,
}: {
  lat: number;
  lng: number;
  excludeContentId?: string | null;
  types?: NearbyTourType[];
  limitPerType?: number;
}): Promise<NearbyTourRecommendations> {
  const entries = await Promise.all(
    types.map(async (type) => [
      type,
      await getNearbyTourItems({ lat, lng, type, excludeContentId, limit: limitPerType }),
    ] as const)
  );

  return {
    travel: entries.find(([type]) => type === "travel")?.[1] ?? [],
    festival: entries.find(([type]) => type === "festival")?.[1] ?? [],
    accommodation: entries.find(([type]) => type === "accommodation")?.[1] ?? [],
  };
}
