import { getAreaName } from "@/lib/constants/area-codes";
import type { CampingSite, Destination } from "@/types/database";
import type { FestivalItem } from "@/types/festival";
import type { TravelCoursePlace } from "./generator";

const TAG_KEYWORDS = [
  "힐링",
  "자연",
  "바다",
  "해변",
  "산책",
  "숲",
  "계곡",
  "공원",
  "전망",
  "야경",
  "시장",
  "카페",
  "맛집",
  "음식",
  "캠핑",
  "글램핑",
  "카라반",
  "가족",
  "아이",
  "체험",
  "박물관",
  "축제",
  "공연",
  "행사",
  "문화",
];

function compactTags(tags: Array<string | null | undefined>) {
  return Array.from(new Set(tags.map((tag) => tag?.trim()).filter(Boolean) as string[]));
}

function extractKeywordTags(...values: Array<string | null | undefined>) {
  const text = values.filter(Boolean).join(" ");
  return TAG_KEYWORDS.filter((keyword) => text.includes(keyword));
}

function toNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function destinationPopularity(row: Destination) {
  return Math.round((row.rating_avg ?? 0) * 10 + Math.min(row.rating_count ?? 0, 20));
}

export function destinationToCoursePlace(
  row: Destination,
  locale: string,
  type: "travel" | "restaurant"
): TravelCoursePlace | null {
  const lat = toNumber(row.mapy);
  const lng = toNumber(row.mapx);
  if (lat === null || lng === null) return null;

  const areaName = getAreaName(row.area_code ?? "", "ko");
  const tags = compactTags([
    type === "restaurant" ? "맛집" : "여행지",
    row.cat3,
    ...extractKeywordTags(row.title, row.addr1, row.overview, row.cat3),
  ]);

  return {
    id: row.content_id,
    type,
    name: row.title,
    region: row.addr1 || areaName,
    lat,
    lng,
    tags,
    popularityScore: destinationPopularity(row),
    imageUrl: row.first_image,
    address: row.addr1,
    href: `/${locale}/${type === "restaurant" ? "restaurants" : "travel"}/${row.content_id}`,
  } satisfies TravelCoursePlace;
}

export function campingToCoursePlace(row: CampingSite, locale: string): TravelCoursePlace | null {
  const lat = toNumber(row.mapy);
  const lng = toNumber(row.mapx);
  if (lat === null || lng === null) return null;

  const tags = compactTags([
    "캠핑",
    row.induty,
    row.sbrs_cl,
    row.animal_cmg_cl,
    ...extractKeywordTags(row.faclt_nm, row.line_intro, row.addr1, row.induty, row.sbrs_cl),
  ]);

  return {
    id: row.content_id,
    type: "camping",
    name: row.faclt_nm,
    region: [row.do_nm, row.sigungu_nm].filter(Boolean).join(" ") || row.addr1,
    lat,
    lng,
    tags,
    popularityScore: Math.round((row.rating_avg ?? 0) * 10 + Math.min(row.rating_count ?? 0, 20)),
    imageUrl: row.first_image_url,
    address: row.addr1,
    href: `/${locale}/camping/${row.content_id}`,
  } satisfies TravelCoursePlace;
}

export function festivalToCoursePlace(row: FestivalItem, locale: string): TravelCoursePlace | null {
  const lat = toNumber(row.mapy);
  const lng = toNumber(row.mapx);
  if (lat === null || lng === null) return null;

  const areaName = getAreaName(row.areaCode ?? "", "ko");
  const tags = compactTags(["축제", "행사", "문화", ...extractKeywordTags(row.title, row.addr1)]);

  return {
    id: row.contentId,
    type: "festival",
    name: row.title,
    region: row.addr1 || areaName,
    lat,
    lng,
    tags,
    popularityScore: 10,
    startDate: row.eventStartDate,
    endDate: row.eventEndDate,
    imageUrl: row.imageUrl,
    address: row.addr1,
    href: `/${locale}/events/${row.contentId}`,
  } satisfies TravelCoursePlace;
}
