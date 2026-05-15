// src/lib/utils/cache-key.ts
// 좌표 기반 unstable_cache 키 생성용 유틸리티.
// 100m 격자(소수점 3자리)로 라운딩해 "주변 1~2km" 검색의 캐시 히트율을 극대화.

export function roundCoord(n: number): number {
  return Math.round(n * 1000) / 1000
}

export function coordKey(lat: number, lng: number): string {
  return `${roundCoord(lat)}:${roundCoord(lng)}`
}
