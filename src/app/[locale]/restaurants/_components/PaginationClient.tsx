"use client"

import { useRouter, useSearchParams } from "next/navigation"

import Pagination from "@/components/shared/Pagination"

interface PaginationClientProps {
  currentPage: number
  totalCount: number
  pageSize: number
  locale: string
  areaCode?: string
}

export default function PaginationClient({
  currentPage,
  totalCount,
  pageSize,
  locale,
  areaCode,
}: PaginationClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handlePageChange(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(page))
    router.push(`/${locale}/restaurants?${params.toString()}`)
  }

  return (
    <Pagination
      currentPage={currentPage}
      totalCount={totalCount}
      pageSize={pageSize}
      onPageChange={handlePageChange}
    />
  )
}
