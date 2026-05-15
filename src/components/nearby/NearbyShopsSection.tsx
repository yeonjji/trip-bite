import { getNearbyShopsCached } from "@/lib/data/nearby-shops"
import NearbyShopsTravelSection from "./NearbyShopsTravelSection"

interface Props {
  lat: number
  lng: number
  isKo: boolean
}

export default async function NearbyShopsSection({ lat, lng, isKo }: Props) {
  try {
    const shops = await getNearbyShopsCached(lat, lng)
    if (!shops) return null
    return <NearbyShopsTravelSection shops={shops} isKo={isKo} />
  } catch (err) {
    console.error("[NearbyShopsSection] failed:", err)
    return null
  }
}
