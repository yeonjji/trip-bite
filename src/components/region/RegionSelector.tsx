"use client"

import { useState, useRef, useEffect } from "react"
import { Search, MapPin, ChevronDown, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// 추천 지역
const RECOMMENDED = ["서울", "부산", "제주", "강릉", "여수", "전주"] as const

// 자동완성용 전국 주요 지역
const ALL_REGIONS = [
  "서울", "강남", "홍대", "명동", "이태원", "종로", "인사동", "북촌",
  "인천", "송도", "강화도",
  "수원", "용인", "고양", "성남", "안산", "화성", "평택",
  "춘천", "원주", "강릉", "속초", "동해", "삼척", "태백", "평창", "홍천", "양양",
  "대전", "세종", "청주", "충주", "천안", "아산", "공주", "논산", "보령",
  "전주", "군산", "익산", "남원", "정읍",
  "광주", "목포", "여수", "순천", "담양", "보성", "완도",
  "부산", "해운대", "광안리", "남포동", "기장",
  "대구", "경주", "포항", "안동", "영주", "구미", "울릉도",
  "울산",
  "창원", "통영", "거제", "남해", "하동", "진주",
  "제주", "서귀포", "성산", "애월",
]

// 모달용 광역 그룹
const REGION_GROUPS: { label: string; regions: string[] }[] = [
  { label: "서울·수도권", regions: ["서울", "강남", "홍대", "명동", "이태원", "종로", "인천", "수원", "고양", "성남", "용인"] },
  { label: "강원", regions: ["춘천", "원주", "강릉", "속초", "동해", "삼척", "태백", "평창", "홍천", "양양"] },
  { label: "충청", regions: ["대전", "세종", "청주", "충주", "천안", "아산", "공주", "논산", "보령"] },
  { label: "전라", regions: ["광주", "전주", "군산", "익산", "남원", "목포", "여수", "순천", "담양"] },
  { label: "경상", regions: ["부산", "해운대", "대구", "경주", "포항", "안동", "울산", "창원", "통영", "거제", "남해", "진주"] },
  { label: "제주", regions: ["제주", "서귀포", "성산", "애월"] },
]

interface Props {
  value: string
  onChange: (region: string) => void
  showNational?: boolean  // "전국" 탭 노출 여부
  showSearch?: boolean
  accentColor?: string
}

export default function RegionSelector({
  value,
  onChange,
  showNational = false,
  showSearch = true,
  accentColor = "#1B1C1A",
}: Props) {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const tabs = showNational ? ["전국", ...RECOMMENDED] : [...RECOMMENDED]

  // 자동완성 필터링
  useEffect(() => {
    if (query.trim().length < 1) {
      setSuggestions([])
      return
    }
    const filtered = ALL_REGIONS.filter((r) => r.includes(query.trim())).slice(0, 6)
    setSuggestions(filtered)
  }, [query])

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        !inputRef.current?.contains(e.target as Node) &&
        !suggestionsRef.current?.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const select = (region: string) => {
    onChange(region)
    setQuery("")
    setSuggestions([])
    setShowSuggestions(false)
    setModalOpen(false)
  }

  return (
    <div className="mb-8 space-y-4">
      {/* ① 추천 지역 탭 — 언더라인 세그먼트 */}
      <div className="border-b border-gray-200">
        <div className="flex overflow-x-auto scrollbar-none">
          {tabs.map((r) => (
            <button
              key={r}
              onClick={() => select(r)}
              style={value === r ? { color: accentColor } : undefined}
              className={`relative shrink-0 whitespace-nowrap px-5 py-2.5 text-sm font-medium transition-colors
                ${value === r ? "font-semibold" : "text-gray-400 hover:text-gray-600"}`}
            >
              {r}
              {value === r && (
                <span
                  className="absolute bottom-0 left-0 h-0.5 w-full rounded-full"
                  style={{ backgroundColor: accentColor }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ② 검색 + 전체보기 */}
      {showSearch && <div className="flex items-center gap-2">
        {/* 검색창 */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => query && setShowSuggestions(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.trim()) {
                select(query.trim())
              }
            }}
            placeholder="지역을 검색해보세요 (예: 속초, 경주, 홍대)"
            className="h-9 w-full rounded-full border border-gray-200 bg-white pl-8 pr-8 text-sm text-gray-700 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setSuggestions([]) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {/* 자동완성 드롭다운 */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute top-full z-20 mt-1 w-full overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg"
            >
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => select(s)}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ③ 전체 지역 보기 버튼 */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger
            render={<button className="flex shrink-0 items-center gap-1 rounded-full border border-gray-200 px-3.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-700 whitespace-nowrap" />}
          >
            전체 지역
            <ChevronDown className="h-3 w-3" />
          </DialogTrigger>
          <DialogContent className="max-w-md sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold text-[#1B1C1A]">전체 지역 보기</DialogTitle>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto space-y-5 pr-1">
              {REGION_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {group.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.regions.map((r) => (
                      <button
                        key={r}
                        onClick={() => select(r)}
                        style={value === r ? { borderColor: accentColor, color: accentColor, backgroundColor: `${accentColor}10` } : undefined}
                        className={`rounded-full border px-3.5 py-1 text-xs font-medium transition-all
                          ${value === r ? "" : "border-gray-200 text-gray-600 hover:border-gray-400"}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>}

      {/* 현재 선택 지역 표시 */}
      {!tabs.includes(value as any) && (
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" style={{ color: accentColor }} />
          <span className="text-sm font-medium" style={{ color: accentColor }}>{value}</span>
          <span className="text-sm text-gray-400">검색 결과</span>
          <button
            onClick={() => select(tabs[0])}
            className="ml-1 text-xs text-gray-400 underline hover:text-gray-600"
          >
            초기화
          </button>
        </div>
      )}
    </div>
  )
}
