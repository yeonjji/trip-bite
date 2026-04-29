import { ExternalLink, MapPin, Phone, Tag } from "lucide-react"

export interface NaverPlace {
  title: string
  category: string
  roadAddress: string
  address: string
  telephone: string
  link: string
}

export default function NaverPlaceCard({ place }: { place: NaverPlace }) {
  const displayAddress = place.roadAddress || place.address

  return (
    <div className="flex flex-col justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="space-y-2">
        <p className="line-clamp-1 font-semibold text-[#1B1C1A]">{place.title}</p>

        {place.category && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F5F0] px-2 py-0.5 text-xs text-gray-500">
            <Tag className="h-3 w-3" />
            {place.category}
          </span>
        )}

        {displayAddress && (
          <p className="flex items-start gap-1 text-sm text-gray-500">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-2">{displayAddress}</span>
          </p>
        )}

        {place.telephone && (
          <p className="flex items-center gap-1 text-sm text-gray-500">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            {place.telephone}
          </p>
        )}
      </div>

      {place.link && (
        <a
          href={place.link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#03C75A] px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          네이버에서 보기
        </a>
      )}
    </div>
  )
}
