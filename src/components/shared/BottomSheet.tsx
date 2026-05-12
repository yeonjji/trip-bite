"use client"

import { useEffect } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title: string
  onReset?: () => void
  onApply?: () => void
  resetLabel?: string
  applyLabel?: string
  children: React.ReactNode
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  onReset,
  onApply,
  resetLabel = "초기화",
  applyLabel = "적용하기",
  children,
}: BottomSheetProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  return (
    <div className="lg:hidden">
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/40 z-[199] transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-[200] bg-white rounded-t-3xl max-h-[82vh] flex flex-col transition-transform duration-300 ease-out",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-stone-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0 border-b border-stone-100">
          <h2 className="font-semibold text-base text-stone-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-100 transition-colors"
            aria-label="닫기"
          >
            <X className="w-4 h-4 text-stone-500" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {children}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-stone-100 px-5 py-4 flex gap-3">
          {onReset && (
            <button
              onClick={onReset}
              className="flex-1 py-3 rounded-2xl border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 active:bg-stone-100 transition-colors"
            >
              {resetLabel}
            </button>
          )}
          <button
            onClick={onApply ?? onClose}
            className="flex-[2] py-3 rounded-2xl bg-[#b05a42] text-white text-sm font-semibold hover:bg-[#9a4e39] active:bg-[#8a4435] transition-colors"
          >
            {applyLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
