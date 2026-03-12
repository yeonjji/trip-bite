// P4-05: 날씨 위젯 서버 컴포넌트

import { getWeatherByAreaCode } from "@/lib/data/weather";
import { GRID_COORDS } from "@/lib/constants/grid-coords";
import { Card, CardContent } from "@/components/ui/card";

interface WeatherWidgetProps {
  areaCode: string;
  locale?: string;
}

// SKY 코드 → 텍스트/이모지
function getSkyLabel(sky: string, pty: string): { label: string; icon: string } {
  // 강수형태 우선
  if (pty === "1") return { label: "비", icon: "🌧️" };
  if (pty === "3") return { label: "눈", icon: "❄️" };
  if (pty === "4") return { label: "소나기", icon: "🌦️" };

  // 하늘 상태
  switch (sky) {
    case "1":
      return { label: "맑음", icon: "☀️" };
    case "3":
      return { label: "구름많음", icon: "⛅" };
    case "4":
      return { label: "흐림", icon: "☁️" };
    default:
      return { label: "맑음", icon: "☀️" };
  }
}

function getSkyLabelFromCode(sky: string): { label: string; icon: string } {
  switch (sky) {
    case "1":
      return { label: "맑음", icon: "☀️" };
    case "3":
      return { label: "구름많음", icon: "⛅" };
    case "4":
      return { label: "흐림", icon: "☁️" };
    default:
      return { label: "맑음", icon: "☀️" };
  }
}

function formatDate(dateStr: string): string {
  // dateStr: "YYYYMMDD"
  const year = dateStr.slice(0, 4);
  const month = dateStr.slice(4, 6);
  const day = dateStr.slice(6, 8);
  const date = new Date(`${year}-${month}-${day}`);
  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric", weekday: "short" });
}

// 3일치 날짜별 최고/최저 기온 집계
function groupForecastByDate(
  forecast: { date: string; time: string; temp: string; sky: string }[]
): { date: string; minTemp: number; maxTemp: number; sky: string }[] {
  const byDate: Record<string, { temps: number[]; skyCounts: Record<string, number> }> = {};

  for (const item of forecast) {
    if (!byDate[item.date]) {
      byDate[item.date] = { temps: [], skyCounts: {} };
    }
    const temp = parseFloat(item.temp);
    if (!isNaN(temp)) byDate[item.date].temps.push(temp);
    byDate[item.date].skyCounts[item.sky] =
      (byDate[item.date].skyCounts[item.sky] ?? 0) + 1;
  }

  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, 3)
    .map(([date, { temps, skyCounts }]) => {
      const minTemp = temps.length > 0 ? Math.min(...temps) : 0;
      const maxTemp = temps.length > 0 ? Math.max(...temps) : 0;
      // 가장 많이 등장한 SKY 코드
      const sky = Object.entries(skyCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "1";
      return { date, minTemp, maxTemp, sky };
    });
}

export default async function WeatherWidget({ areaCode, locale = "ko" }: WeatherWidgetProps) {
  const weather = await getWeatherByAreaCode(areaCode);
  const coords = GRID_COORDS[areaCode];
  const cityName = coords?.cityName ?? areaCode;

  if (!weather || !weather.current) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">날씨 정보를 불러올 수 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  const { current, forecast } = weather;
  const { label: skyLabel, icon: skyIcon } = getSkyLabel(current.sky, current.pty);
  const dailyForecasts = groupForecastByDate(forecast);

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        {/* 현재 날씨 */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{cityName}</p>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-3xl font-bold">{current.temp}°</span>
              <span className="text-base text-muted-foreground mb-0.5">{skyLabel}</span>
            </div>
          </div>
          <span className="text-4xl" role="img" aria-label={skyLabel}>
            {skyIcon}
          </span>
        </div>

        {/* 3일 예보 */}
        {dailyForecasts.length > 0 && (
          <>
            <div className="mt-4 border-t pt-3">
              <div className="grid grid-cols-3 gap-2">
                {dailyForecasts.map((day) => {
                  const { icon, label } = getSkyLabelFromCode(day.sky);
                  return (
                    <div key={day.date} className="flex flex-col items-center gap-1">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(day.date)}
                      </span>
                      <span className="text-xl" role="img" aria-label={label}>
                        {icon}
                      </span>
                      <div className="flex gap-1 text-xs">
                        <span className="text-blue-500">{Math.round(day.minTemp)}°</span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-red-500">{Math.round(day.maxTemp)}°</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
