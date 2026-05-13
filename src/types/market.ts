export interface MarketItem {
  mktId: string
  mktNm: string
  rdnAdr: string | null
  lnmAdr: string | null
  sidoNm: string | null
  sggNm: string | null
  mktTpNm: string | null
  parkingYn: string | null
  lat: number | null
  lng: number | null
  telNo: string | null
  storNumber: string | null
  trtmntPrdlst: string | null
  estblYear: string | null
  mrktCycle: string | null
  itgMktYn: string | null
  scsflTpNm: string | null
  areaCd: string | null
}

export interface NearbyMarket {
  id: number
  mktId: string
  mktNm: string
  rdnAdr: string | null
  lat: number
  lng: number
  mktTpNm: string | null
  parkingYn: string | null
  telNo: string | null
  distance_m: number
}

export interface MarketFilterParams {
  region?: string
  mktType?: string
  search?: string
  page?: number
}
