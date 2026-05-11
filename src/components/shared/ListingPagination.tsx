"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import Pagination from "@/components/shared/Pagination"

interface ListingPaginationProps {
  currentPage: number
  totalCount: number
  pageSize: number
}

export default function ListingPagination({ currentPage, totalCount, pageSize }: ListingPaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function handlePageChange(page: number) {
    const sp = new URLSearchParams(searchParams.toString())
    sp.set("page", String(page))
    router.push(`${pathname}?${sp.toString()}`)
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
