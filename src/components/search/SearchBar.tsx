"use client"

import { Search } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface SearchBarProps {
  defaultValue?: string
  placeholder?: string
  className?: string
}

export default function SearchBar({
  defaultValue = "",
  placeholder = "여행지, 캠핑장을 검색하세요",
  className,
}: SearchBarProps) {
  const router = useRouter()
  const params = useParams()
  const locale = (params?.locale as string) ?? "ko"
  const [query, setQuery] = useState(defaultValue)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    router.push(`/${locale}/search?q=${encodeURIComponent(trimmed)}`)
  }

  return (
    <form onSubmit={handleSubmit} className={cn("flex gap-2", className)}>
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="flex-1"
      />
      <Button type="submit" aria-label="검색">
        <Search className="size-4" />
        <span className="ml-1">검색</span>
      </Button>
    </form>
  )
}
