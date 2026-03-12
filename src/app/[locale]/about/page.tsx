import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "소개 | 여행한입",
  description: "여행한입 서비스 소개 — 대한민국 여행지, 맛집, 캠핑장, 특산품, 레시피를 한입에.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-4 text-3xl font-black text-amber-900">여행한입 소개</h1>
      <p className="mb-10 text-lg text-muted-foreground">
        대한민국의 아름다운 여행지, 지역 맛집, 캠핑장, 특산품, 그리고 특산품으로 만드는 레시피까지 —
        여행의 모든 즐거움을 한 입에 담았습니다.
      </p>

      <section className="mb-10">
        <h2 className="mb-3 text-xl font-bold text-amber-800">서비스 목적</h2>
        <p className="text-muted-foreground leading-relaxed">
          여행한입은 한국관광공사, 식품의약품안전처, 기상청 등 공공 API를 활용하여
          여행자에게 실용적이고 풍부한 여행 정보를 제공합니다.
          단순한 여행지 안내를 넘어, 지역 특산품과 그것으로 만드는 레시피까지 연결하여
          여행의 미식 경험을 극대화합니다.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-xl font-bold text-amber-800">데이터 출처</h2>
        <ul className="space-y-2 text-muted-foreground">
          <li>• <strong>여행지 · 맛집</strong>: 한국관광공사 Tour API 4.0</li>
          <li>• <strong>캠핑장</strong>: 한국관광공사 고캠핑 API</li>
          <li>• <strong>레시피</strong>: 식품의약품안전처 조리식품 레시피 DB (COOKRCP01)</li>
          <li>• <strong>날씨</strong>: 기상청 단기예보 API</li>
          <li>• <strong>지도</strong>: 네이버 지도 API</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-xl font-bold text-amber-800">주요 기능</h2>
        <ul className="space-y-2 text-muted-foreground">
          <li>• 지역별 여행지 탐색 및 상세 정보</li>
          <li>• 지역 맛집 검색 및 리뷰</li>
          <li>• 전국 캠핑장 정보 및 예약 연결</li>
          <li>• 제철 특산품 소개 및 레시피 연결</li>
          <li>• 날씨 기반 여행지 추천</li>
          <li>• 무장애 여행 정보 제공</li>
          <li>• 한국어 / 영어 지원</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-amber-800">문의</h2>
        <p className="text-muted-foreground">
          서비스 이용 중 문제가 있거나 개선 사항이 있으시면 아래로 문의해주세요.
        </p>
        <p className="mt-2 text-amber-700 font-medium">contact@trip-bite.kr</p>
      </section>
    </main>
  );
}
