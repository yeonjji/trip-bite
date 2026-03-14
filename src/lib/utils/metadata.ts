const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://trip-bite.vercel.app";

export function buildAlternates(pagePath: string) {
  return {
    languages: {
      ko: `${BASE_URL}/ko${pagePath}`,
      en: `${BASE_URL}/en${pagePath}`,
      "x-default": `${BASE_URL}/ko${pagePath}`,
    },
  };
}
