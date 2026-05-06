"use client"

import { Share2, CalendarPlus } from "lucide-react"

interface Props {
  title: string
  isKo: boolean
  startDate: string
  endDate: string
  venue?: string | null
}

function parseYYYYMMDD(d: string): Date | null {
  if (!d || d.length < 8) return null
  return new Date(
    parseInt(d.slice(0, 4)),
    parseInt(d.slice(4, 6)) - 1,
    parseInt(d.slice(6, 8))
  )
}

function toGoogleCalDate(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`
}

export default function FestivalShareActions({ title, isKo, startDate, endDate, venue }: Props) {
  const hasValidDates = !!parseYYYYMMDD(startDate) && !!parseYYYYMMDD(endDate)

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: window.location.href })
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(window.location.href)
      alert(isKo ? "링크가 복사되었습니다." : "Link copied!")
    }
  }

  const handleCalendar = () => {
    const start = parseYYYYMMDD(startDate)
    const end = parseYYYYMMDD(endDate)
    if (!start || !end) return

    const endPlusOne = new Date(end)
    endPlusOne.setDate(endPlusOne.getDate() + 1)

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: title,
      dates: `${toGoogleCalDate(start)}/${toGoogleCalDate(endPlusOne)}`,
      details: isKo ? `축제 정보: ${window.location.href}` : `Festival: ${window.location.href}`,
      location: venue ?? "",
    })
    window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, "_blank")
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-[#5A413A] transition hover:border-[#D84315] hover:text-[#D84315]"
      >
        <Share2 size={14} />
        {isKo ? "공유" : "Share"}
      </button>
      {hasValidDates && (
        <button
          onClick={handleCalendar}
          className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-[#5A413A] transition hover:border-[#D84315] hover:text-[#D84315]"
        >
          <CalendarPlus size={14} />
          {isKo ? "캘린더 추가" : "Add to Calendar"}
        </button>
      )}
    </div>
  )
}
