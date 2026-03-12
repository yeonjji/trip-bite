"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="text-8xl font-black text-amber-200">500</div>
      <h1 className="text-2xl font-bold text-foreground">서버 오류가 발생했어요</h1>
      <p className="max-w-md text-muted-foreground">
        잠시 후 다시 시도해주세요. 문제가 계속되면 고객센터에 문의해주세요.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-amber-700 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-amber-800"
        >
          다시 시도
        </button>
        <Link
          href="/"
          className="rounded-lg border border-amber-200 px-6 py-3 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-50"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
