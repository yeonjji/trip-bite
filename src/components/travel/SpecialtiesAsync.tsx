import { getSpecialtiesByRegionName } from "@/lib/data/specialties"
import TravelSpecialtiesSection from "@/components/travel/TravelSpecialtiesSection"

type Props = {
  regionFullName: string
  regionName: string | null
  limit?: number
}

export default async function SpecialtiesAsync({ regionFullName, regionName, limit = 5 }: Props) {
  const specialties = await getSpecialtiesByRegionName(regionFullName, limit)
  return <TravelSpecialtiesSection specialties={specialties} regionName={regionName} />
}

export function SpecialtiesSkeleton() {
  return (
    <div className="mb-8">
      <div className="mb-4 h-6 w-40 animate-pulse rounded bg-gray-200" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    </div>
  )
}
