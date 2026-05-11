export function naverApiHeaders(clientId: string, clientSecret: string) {
  return {
    "X-Naver-Client-Id": clientId,
    "X-Naver-Client-Secret": clientSecret,
  }
}

export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "")
}

export function getNaverCredentials(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.NAVER_LOCAL_CLIENT_ID
  const clientSecret = process.env.NAVER_LOCAL_CLIENT_SECRET
  if (!clientId || !clientSecret) return null
  return { clientId, clientSecret }
}
