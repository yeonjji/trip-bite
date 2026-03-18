"use client"

import { useRouter, useSearchParams } from "next/navigation"

import Pagination from "@/components/shared/Pagination"

interface CampingPaginationProps {
  locale: string
  currentPage: number
  totalCount: number
  pageSize: number
  basePath?: string
}

export default function CampingPagination({
  locale,
  currentPage,
  totalCount,
  pageSize,
  basePath = "/camping",
}: CampingPaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(page))
    router.push(`/${locale}${basePath}?${params.toString()}`)
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
