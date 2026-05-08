import { getVisitorTips, type VisitorTipData } from "@/lib/data/visitor-stats";

// ─── 자연어 생성 helpers ──────────────────────────────────────

function buildFeaturedInsight(d: VisitorTipData): string {
  if (d.dominantType === "local" && d.weekendRatio < 1.3) {
    return "현지인들이 즐겨 찾는 조용한 분위기의 장소예요. 주말에도 비교적 여유롭게 둘러볼 수 있어요";
  }
  if (d.dominantType === "local") {
    return "현지인이 자주 찾는 로컬 감성이 살아있는 곳이에요";
  }
  if (d.dominantType === "foreign" && d.outsiderRatio > 0.3) {
    return "국내외 여행자 모두에게 사랑받는 인기 여행지예요";
  }
  if (d.dominantType === "foreign") {
    return "외국인 여행자도 즐겨 찾는 국제적인 감성의 여행지예요";
  }
  if (d.outsiderRatio > 0.55 && d.weekendRatio > 1.5) {
    return "전국에서 방문객이 찾아오는 인기 여행지예요. 주말엔 이른 방문을 추천해요";
  }
  if (d.outsiderRatio > 0.5) {
    return "전국 각지의 여행자가 찾아오는 인기 여행지예요";
  }
  if (d.weekendRatio < 1.2) {
    return "주말과 평일 모두 여유롭게 즐길 수 있는 편안한 여행지예요";
  }
  return "방문 패턴을 알고 가면 더 여유로운 여행을 즐길 수 있어요";
}

function buildTimingTip(d: VisitorTipData): string {
  if (d.weekendRatio > 1.6) {
    return `한산하게 즐기려면 평일 방문을 추천해요. 특히 ${d.quietestDay}이 비교적 여유로워요`;
  }
  if (d.weekendRatio > 1.3) {
    return `${d.quietestDay}에 방문하면 더 여유롭게 즐길 수 있어요`;
  }
  return `${d.quietestDay}에는 비교적 한산하게 둘러볼 수 있어요`;
}

function buildWeekendTip(d: VisitorTipData): string {
  if (d.weekendRatio > 1.7) {
    return `주말 혼잡도가 높은 편이에요. ${d.busiestDay} 오전 일찍 방문하거나 평일을 추천해요`;
  }
  if (d.weekendRatio > 1.3) {
    return "주말에는 방문객이 다소 늘어나는 편이에요";
  }
  return "주말에도 비교적 여유롭게 즐길 수 있어요";
}

function buildVisitorTypeTip(d: VisitorTipData): string {
  if (d.dominantType === "local" && d.localRatio > 0.6) {
    return "현지인이 자주 찾는 로컬 감성의 장소예요";
  }
  if (d.dominantType === "local") {
    return "현지인과 여행자 모두 즐겨 찾는 곳이에요";
  }
  if (d.dominantType === "foreign") {
    return "외국인 여행자도 즐겨 찾는 국제적인 여행지예요";
  }
  return "외지인 방문 비율이 높은 인기 여행지예요";
}

function buildSeasonalTip(d: VisitorTipData): string | null {
  if (!d.hasSeasonData || !d.peakSeason) return null;
  const seasonDesc: Record<string, string> = {
    봄: "봄에 방문객이 가장 많은 편이에요",
    여름: "여름 시즌에 방문객이 집중되는 편이에요",
    가을: "가을 단풍 시즌에 방문객이 가장 많아요",
    겨울: "겨울에도 방문객이 많은 편이에요",
  };
  return seasonDesc[d.peakSeason] ?? null;
}

// ─── Component ────────────────────────────────────────────────

export default async function TravelTipSection({
  signguCode,
}: {
  signguCode?: string | null;
}) {
  if (!signguCode) return null;
  const data = await getVisitorTips(signguCode);
  if (!data) return null;

  const insight = buildFeaturedInsight(data);
  const seasonalTip = buildSeasonalTip(data);

  const tips = [
    { icon: "🕐", label: "추천 방문 시간", text: buildTimingTip(data) },
    { icon: "📅", label: "주말 혼잡도",    text: buildWeekendTip(data) },
    { icon: "👥", label: "방문객 특징",    text: buildVisitorTypeTip(data) },
    ...(seasonalTip ? [{ icon: "🌸", label: "계절별 특성", text: seasonalTip }] : []),
  ];

  return (
    <div className="mb-6">
      {/* 헤더 */}
      <div className="mb-3 flex items-center gap-2">
        <h2 className="font-headline text-base font-bold text-[#1B1C1A]">방문 팁</h2>
        <span className="rounded-full bg-[#FFE8DF] px-2.5 py-0.5 text-[10px] font-semibold text-[#D84315]">
          관광 빅데이터
        </span>
      </div>

      {/* 핵심 인사이트 — 에디토리얼 인용 스타일 */}
      <blockquote className="mb-4 rounded-r-xl border-l-[3px] border-[#D84315] bg-[#FFF3EF] px-4 py-3">
        <p className="text-sm italic leading-relaxed text-[#5A413A]">
          &ldquo;{insight}&rdquo;
        </p>
      </blockquote>

      {/* 세부 팁 리스트 */}
      <div className="overflow-hidden rounded-xl border border-[#F0EDE5] bg-white divide-y divide-[#F4F1E9]">
        {tips.map((tip) => (
          <div key={tip.label} className="flex items-start gap-3 px-4 py-3">
            <span className="mt-0.5 flex-shrink-0 text-base leading-none" aria-hidden>
              {tip.icon}
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#D84315]">
                {tip.label}
              </p>
              <p className="mt-0.5 text-sm leading-relaxed text-[#5A413A]">{tip.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
