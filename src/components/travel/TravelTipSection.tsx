import { getVisitorTips, type VisitorTipData } from "@/lib/data/visitor-stats";

interface TipCard {
  icon: string;
  label: string;
  text: string;
}

function buildTips(data: VisitorTipData): TipCard[] {
  const { localRatio, outsiderRatio, foreignRatio, weekendRatio, quietestDay } = data;
  const tips: TipCard[] = [];

  // 한산한 시간 / 추천 방문 시간
  if (weekendRatio > 1.6) {
    tips.push({
      icon: "🕐",
      label: "한산한 시간",
      text: "주말에는 방문객이 집중되는 편이에요. 여유롭게 즐기려면 평일 방문을 추천해요",
    });
  } else {
    tips.push({
      icon: "🕐",
      label: "추천 방문 시간",
      text: `${quietestDay}에는 비교적 한산하게 둘러볼 수 있어요`,
    });
  }

  // 주말 혼잡도
  if (weekendRatio > 1.6) {
    tips.push({
      icon: "📅",
      label: "주말 혼잡도",
      text: "주말 오후에는 방문객이 많은 편이에요. 오전 일찍 방문하면 더 여유로워요",
    });
  } else if (weekendRatio > 1.2) {
    tips.push({
      icon: "📅",
      label: "주말 혼잡도",
      text: "주말에는 방문객이 다소 늘어나는 편이에요",
    });
  } else {
    tips.push({
      icon: "📅",
      label: "주말 혼잡도",
      text: "주말에도 비교적 여유롭게 즐길 수 있는 편이에요",
    });
  }

  // 방문객 특징 (현지인 추천 / 외국인 / 외지인)
  if (localRatio > 0.55) {
    tips.push({
      icon: "👥",
      label: "현지인 추천",
      text: "현지인이 자주 찾는 로컬 감성의 장소예요",
    });
  } else if (foreignRatio > 0.12) {
    tips.push({
      icon: "🌍",
      label: "방문객 특징",
      text: "외국인 여행자도 즐겨 찾는 국제적인 여행지예요",
    });
  } else if (outsiderRatio > 0.5) {
    tips.push({
      icon: "👥",
      label: "방문객 특징",
      text: "외지인 방문 비율이 높은 인기 여행지예요",
    });
  } else {
    tips.push({
      icon: "👥",
      label: "방문객 특징",
      text: "현지인과 여행자 모두 즐겨 찾는 곳이에요",
    });
  }

  return tips;
}

export default async function TravelTipSection({
  signguCode,
}: {
  signguCode?: string | null;
}) {
  const data = await getVisitorTips(signguCode);
  if (!data) return null;

  const tips = buildTips(data);

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-lg">🧭</span>
        <h2 className="font-headline text-base font-bold text-[#1B1C1A]">방문 팁</h2>
        <span className="text-xs text-muted-foreground">관광 빅데이터 기반 방문 패턴</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tips.map((tip) => (
          <div
            key={tip.label}
            className="flex flex-col rounded-xl border border-[#FFE8DF] bg-[#FFF8F5] p-4"
          >
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFE0D4] text-lg leading-none">
              {tip.icon}
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#D84315]">
              {tip.label}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[#5A413A]">{tip.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
