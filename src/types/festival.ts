export interface FestivalItem {
  contentId: string
  title: string
  imageUrl: string | null
  addr1: string
  addr2: string | null
  areaCode: string
  sigunguCode: string | null
  mapx: number | null
  mapy: number | null
  eventStartDate: string  // YYYYMMDD
  eventEndDate: string
}

export type FestivalStatus = "ongoing" | "upcoming" | "ended"

export interface FestivalFilterParams {
  region?: string
  status?: FestivalStatus | ""
  search?: string
  page?: number
}
