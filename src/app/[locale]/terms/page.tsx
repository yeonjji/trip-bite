import type { Metadata } from "next";
import { buildAlternates } from "@/lib/utils/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "en" ? "Terms of Service | Trip Bite" : "이용약관 | 여행한입",
    alternates: buildAlternates("/terms"),
  };
}

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-2 text-3xl font-black text-amber-900">이용약관</h1>
      <p className="mb-10 text-sm text-muted-foreground">최종 수정일: 2026년 3월 12일</p>

      <section className="mb-8 space-y-3">
        <h2 className="text-xl font-bold text-amber-800">제1조 (목적)</h2>
        <p className="text-muted-foreground leading-relaxed">
          이 약관은 여행한입(이하 "서비스")이 제공하는 인터넷 서비스의 이용 조건 및 절차,
          서비스 이용자와 서비스 간의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.
        </p>
      </section>

      <section className="mb-8 space-y-3">
        <h2 className="text-xl font-bold text-amber-800">제2조 (서비스 내용)</h2>
        <p className="text-muted-foreground leading-relaxed">
          여행한입은 공공 API를 활용한 여행 정보 조회, 리뷰 작성, 특산품 및 레시피 탐색 기능을 제공합니다.
          서비스의 일부 또는 전부는 운영 정책에 따라 변경될 수 있습니다.
        </p>
      </section>

      <section className="mb-8 space-y-3">
        <h2 className="text-xl font-bold text-amber-800">제3조 (이용자 의무)</h2>
        <ul className="space-y-1 text-muted-foreground ml-4">
          <li>• 타인의 개인정보를 무단으로 수집, 저장, 공개하는 행위 금지</li>
          <li>• 서비스의 안정적 운영을 방해하는 행위 금지</li>
          <li>• 허위 정보 또는 음란, 폭력적 콘텐츠 작성 금지</li>
          <li>• 저작권 등 타인의 지적재산권 침해 금지</li>
          <li>• 관련 법령 및 본 약관 준수</li>
        </ul>
      </section>

      <section className="mb-8 space-y-3">
        <h2 className="text-xl font-bold text-amber-800">제4조 (서비스 제한)</h2>
        <p className="text-muted-foreground leading-relaxed">
          서비스는 다음의 경우 사전 통지 없이 서비스 제공을 제한하거나 중단할 수 있습니다.
        </p>
        <ul className="space-y-1 text-muted-foreground ml-4">
          <li>• 시스템 점검, 보수, 교체 시</li>
          <li>• 천재지변, 국가 비상 사태 등 불가항력적 사유 발생 시</li>
          <li>• 이용자가 본 약관을 위반한 경우</li>
        </ul>
      </section>

      <section className="mb-8 space-y-3">
        <h2 className="text-xl font-bold text-amber-800">제5조 (면책 조항)</h2>
        <p className="text-muted-foreground leading-relaxed">
          서비스에서 제공하는 여행 정보는 공공 API 데이터를 기반으로 하며,
          정확성 및 최신성을 보장하지 않습니다.
          서비스 이용으로 인한 손해에 대해 서비스는 책임을 지지 않습니다.
        </p>
      </section>

      <section className="mb-8 space-y-3">
        <h2 className="text-xl font-bold text-amber-800">제6조 (저작권)</h2>
        <p className="text-muted-foreground leading-relaxed">
          서비스가 제공하는 콘텐츠의 저작권은 각 공공기관 또는 서비스에 귀속됩니다.
          이용자가 작성한 리뷰의 저작권은 작성자에게 있으나, 서비스 운영을 위한 범위 내에서 이용을 허락합니다.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-amber-800">제7조 (문의)</h2>
        <p className="text-muted-foreground">
          약관에 관한 문의: <span className="text-amber-700 font-medium">contact@trip-bite.kr</span>
        </p>
      </section>
    </main>
  );
}
