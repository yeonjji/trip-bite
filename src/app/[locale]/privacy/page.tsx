import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 | 여행한입",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-2 text-3xl font-black text-amber-900">개인정보처리방침</h1>
      <p className="mb-10 text-sm text-muted-foreground">최종 수정일: 2026년 3월 12일</p>

      <section className="mb-8 space-y-3">
        <h2 className="text-xl font-bold text-amber-800">1. 수집하는 개인정보</h2>
        <p className="text-muted-foreground leading-relaxed">
          여행한입은 서비스 이용을 위해 최소한의 개인정보만을 수집합니다.
        </p>
        <ul className="space-y-1 text-muted-foreground ml-4">
          <li>• <strong>회원가입 시</strong>: 이메일 주소 (Supabase Auth 처리)</li>
          <li>• <strong>리뷰 작성 시</strong>: 리뷰 내용, 별점 (인증된 사용자 한정)</li>
          <li>• <strong>서비스 이용 시</strong>: 접속 로그 (IP 주소, 브라우저 정보)</li>
        </ul>
      </section>

      <section className="mb-8 space-y-3">
        <h2 className="text-xl font-bold text-amber-800">2. 개인정보 이용 목적</h2>
        <ul className="space-y-1 text-muted-foreground ml-4">
          <li>• 서비스 제공 및 회원 관리</li>
          <li>• 리뷰 기능 제공</li>
          <li>• 서비스 개선을 위한 통계 분석</li>
          <li>• 불법 이용 방지 및 서비스 보안</li>
        </ul>
      </section>

      <section className="mb-8 space-y-3">
        <h2 className="text-xl font-bold text-amber-800">3. 개인정보 보관 기간</h2>
        <p className="text-muted-foreground leading-relaxed">
          회원 탈퇴 시 즉시 삭제합니다. 단, 관련 법령에 따라 일정 기간 보관이 필요한 경우 해당 기간 동안 보관합니다.
        </p>
      </section>

      <section className="mb-8 space-y-3">
        <h2 className="text-xl font-bold text-amber-800">4. 제3자 제공</h2>
        <p className="text-muted-foreground leading-relaxed">
          여행한입은 이용자의 개인정보를 제3자에게 제공하지 않습니다.
          단, 법령에 의거하거나 이용자의 동의가 있는 경우는 예외입니다.
        </p>
      </section>

      <section className="mb-8 space-y-3">
        <h2 className="text-xl font-bold text-amber-800">5. 쿠키 사용</h2>
        <p className="text-muted-foreground leading-relaxed">
          서비스는 로그인 세션 유지를 위해 쿠키를 사용합니다.
          브라우저 설정에서 쿠키를 거부할 수 있으나, 일부 기능이 제한될 수 있습니다.
        </p>
      </section>

      <section className="mb-8 space-y-3">
        <h2 className="text-xl font-bold text-amber-800">6. 이용자 권리</h2>
        <p className="text-muted-foreground leading-relaxed">
          이용자는 언제든지 개인정보 열람, 수정, 삭제를 요청할 수 있습니다.
          문의: <span className="text-amber-700 font-medium">contact@trip-bite.kr</span>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-amber-800">7. 개인정보 보호책임자</h2>
        <p className="text-muted-foreground">이메일: contact@trip-bite.kr</p>
      </section>
    </main>
  );
}
