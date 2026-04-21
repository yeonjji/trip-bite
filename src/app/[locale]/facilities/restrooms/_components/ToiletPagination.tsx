"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Pagination from "@/components/shared/Pagination";

interface ToiletPaginationProps {
  locale: string;
  currentPage: number;
  totalCount: number;
  pageSize: number;
}

export default function ToiletPagination({ locale, currentPage, totalCount, pageSize }: ToiletPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`/${locale}/facilities/restrooms?${params.toString()}`);
  };

  return (
    <Pagination
      currentPage={currentPage}
      totalCount={totalCount}
      pageSize={pageSize}
      onPageChange={handlePageChange}
    />
  );
}
