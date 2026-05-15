import { getSpecialtiesByRegionNameCached } from "@/lib/data/specialties"
import TravelSpecialtiesSection from "./TravelSpecialtiesSection"

interface Props {
  regionFullName: string | null
  regionName: string | null
  limit?: number
}

export default async function SpecialtiesSection({
  regionFullName,
  regionName,
  limit = 5,
}: Props) {
  if (!regionFullName) return null
  try {
    const specialties = await getSpecialtiesByRegionNameCached(regionFullName, limit)
    return (
      <TravelSpecialtiesSection
        specialties={specialties}
        regionName={regionName}
      />
    )
  } catch (err) {
    console.error("[SpecialtiesSection] failed:", err)
    return null
  }
}
