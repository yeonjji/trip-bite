"use client"

import { Share2 } from "lucide-react"

interface Props {
  title: string
  isKo: boolean
  className?: string
}

export default function ShareButton({ title, isKo, className }: Props) {
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

  return (
    <button
      onClick={handleShare}
      className={
        className ??
        "flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-[#5A413A] transition hover:border-[#D84315] hover:text-[#D84315]"
      }
    >
      <Share2 size={14} />
      {isKo ? "공유" : "Share"}
    </button>
  )
}
