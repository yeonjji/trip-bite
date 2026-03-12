// P1-17: 캐시 유효성 검사 및 조건부 fetch 유틸리티

const DEFAULT_TTL_HOURS = 24;

/**
 * cachedAt 시각으로부터 ttlHours 시간이 지나지 않았으면 true
 */
export function isCacheValid(cachedAt: string, ttlHours: number = DEFAULT_TTL_HOURS): boolean {
  const cachedTime = new Date(cachedAt).getTime();
  if (isNaN(cachedTime)) return false;

  const expiresAt = cachedTime + ttlHours * 60 * 60 * 1000;
  return Date.now() < expiresAt;
}

/**
 * 캐시가 유효하면 null을 반환하고, 만료됐거나 없으면 fetchFn을 실행해 결과를 반환.
 *
 * 사용 예:
 *   const fresh = await getCachedOrFetch(row?.cachedAt ?? null, 24, () => fetchRemote());
 *   if (fresh !== null) { // DB에 저장 후 사용 }
 */
export async function getCachedOrFetch<T>(
  cachedAt: string | null,
  ttlHours: number = DEFAULT_TTL_HOURS,
  fetchFn: () => Promise<T>
): Promise<T | null> {
  if (cachedAt !== null && isCacheValid(cachedAt, ttlHours)) {
    return null;
  }

  return fetchFn();
}
