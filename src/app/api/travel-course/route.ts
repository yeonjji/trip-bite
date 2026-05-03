import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  campingToCoursePlace,
  destinationToCoursePlace,
  festivalToCoursePlace,
} from "@/lib/travel-course/adapters";
import {
  generateTravelCourse,
  type TravelCourseDatasets,
  type TravelCoursePlace,
  type TravelCourseStyle,
  type TravelCourseTripType,
} from "@/lib/travel-course/generator";
import type { CampingSite, Destination } from "@/types/database";
import type { FestivalItem } from "@/types/festival";

const TRIP_TYPES: TravelCourseTripType[] = ["dayTrip", "overnight", "twoNights"];
const STYLES: TravelCourseStyle[] = ["healing", "food", "camping", "date", "family", "festival"];

function sanitizeTerm(value: string) {
  return value.trim().replace(/[,%]/g, "");
}

function todayString() {
  const today = new Date();
  return `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(
    today.getDate()
  ).padStart(2, "0")}`;
}

function isCoursePlace(place: TravelCoursePlace | null): place is TravelCoursePlace {
  return place !== null;
}

function mapFestivalRow(row: Record<string, unknown>): FestivalItem {
  return {
    contentId: row.content_id as string,
    title: row.title as string,
    imageUrl: (row.image_url as string) || null,
    addr1: (row.addr1 as string) || "",
    addr2: (row.addr2 as string) || null,
    areaCode: (row.area_code as string) || "",
    sigunguCode: (row.sigungu_code as string) || null,
    mapx: row.mapx != null ? Number(row.mapx) : null,
    mapy: row.mapy != null ? Number(row.mapy) : null,
    eventStartDate: (row.event_start_date as string) || "",
    eventEndDate: (row.event_end_date as string) || "",
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const region = sanitizeTerm(searchParams.get("region") ?? "");
  const tripTypeParam = searchParams.get("tripType") as TravelCourseTripType | null;
  const styleParam = searchParams.get("style") as TravelCourseStyle | null;
  const locale = searchParams.get("locale") === "en" ? "en" : "ko";

  if (!region) {
    return NextResponse.json({ error: "region 파라미터가 필요합니다." }, { status: 400 });
  }

  const tripType = tripTypeParam && TRIP_TYPES.includes(tripTypeParam) ? tripTypeParam : "dayTrip";
  const style = styleParam && STYLES.includes(styleParam) ? styleParam : "healing";
  const supabase = await createClient();
  const activeDate = todayString();

  const [travelResult, restaurantResult, campingResult, festivalResult] = await Promise.allSettled([
    supabase
      .from("destinations")
      .select("*")
      .neq("content_type_id", "39")
      .or(`addr1.ilike.%${region}%,title.ilike.%${region}%`)
      .order("has_image", { ascending: false, nullsFirst: false })
      .order("rating_avg", { ascending: false })
      .limit(50),
    supabase
      .from("destinations")
      .select("*")
      .eq("content_type_id", "39")
      .or(`addr1.ilike.%${region}%,title.ilike.%${region}%`)
      .order("has_image", { ascending: false, nullsFirst: false })
      .order("rating_avg", { ascending: false })
      .limit(50),
    supabase
      .from("camping_sites")
      .select("*")
      .or(
        `addr1.ilike.%${region}%,do_nm.ilike.%${region}%,sigungu_nm.ilike.%${region}%,faclt_nm.ilike.%${region}%`
      )
      .order("has_image", { ascending: false, nullsFirst: false })
      .order("rating_avg", { ascending: false })
      .limit(50),
    supabase
      .from("festivals")
      .select("*")
      .lte("event_start_date", activeDate)
      .gte("event_end_date", activeDate)
      .or(`addr1.ilike.%${region}%,title.ilike.%${region}%`)
      .order("event_start_date", { ascending: true })
      .limit(30),
  ]);

  const travelRows = travelResult.status === "fulfilled" && !travelResult.value.error
    ? ((travelResult.value.data ?? []) as Destination[])
    : [];
  const restaurantRows = restaurantResult.status === "fulfilled" && !restaurantResult.value.error
    ? ((restaurantResult.value.data ?? []) as Destination[])
    : [];
  const campingRows = campingResult.status === "fulfilled" && !campingResult.value.error
    ? ((campingResult.value.data ?? []) as CampingSite[])
    : [];
  const festivalRows = festivalResult.status === "fulfilled" && !festivalResult.value.error
    ? ((festivalResult.value.data ?? []) as Record<string, unknown>[]).map(mapFestivalRow)
    : [];

  const datasets: TravelCourseDatasets = {
    travelSpots: travelRows
      .map((row) => destinationToCoursePlace(row, locale, "travel"))
      .filter(isCoursePlace),
    restaurants: restaurantRows
      .map((row) => destinationToCoursePlace(row, locale, "restaurant"))
      .filter(isCoursePlace),
    campings: campingRows.map((row) => campingToCoursePlace(row, locale)).filter(isCoursePlace),
    festivals: festivalRows.map((row) => festivalToCoursePlace(row, locale)).filter(isCoursePlace),
  };

  const course = generateTravelCourse({ region, tripType, style, datasets });

  return NextResponse.json(
    {
      course,
      meta: {
        region,
        tripType,
        style,
        counts: {
          travel: datasets.travelSpots.length,
          restaurants: datasets.restaurants.length,
          campings: datasets.campings.length,
          festivals: datasets.festivals.length,
        },
      },
    },
    { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" } }
  );
}
