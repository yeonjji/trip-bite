import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="text-8xl font-black text-amber-200">404</div>
      <h1 className="text-2xl font-bold text-foreground">페이지를 찾을 수 없어요</h1>
      <p className="max-w-md text-muted-foreground">
        요청하신 페이지가 존재하지 않거나 이동되었습니다.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-amber-700 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-amber-800"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
