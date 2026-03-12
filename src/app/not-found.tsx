import Link from "next/link";

export default function NotFound() {
  return (
    <html lang="ko">
      <body>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: "24px", padding: "16px", textAlign: "center", fontFamily: "sans-serif" }}>
          <div style={{ fontSize: "96px", fontWeight: 900, color: "#fde68a" }}>404</div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#1c1917" }}>페이지를 찾을 수 없어요</h1>
          <p style={{ color: "#78716c", maxWidth: "400px" }}>요청하신 페이지가 존재하지 않습니다.</p>
          <Link href="/ko" style={{ background: "#92400e", color: "white", padding: "12px 24px", borderRadius: "8px", textDecoration: "none", fontSize: "14px" }}>
            홈으로 돌아가기
          </Link>
        </div>
      </body>
    </html>
  );
}
