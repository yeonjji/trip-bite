export function buildNaverMapUrl(title: string, lat?: number, lng?: number): string {
  if (lat && lng) {
    return `https://map.naver.com/v5/search/${encodeURIComponent(title)}?c=${lng},${lat},15,0,0,0,dh`
  }
  return `https://map.naver.com/v5/search/${encodeURIComponent(title)}`
}
