import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://openapi.map.naver.com https://maps.googleapis.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https: http:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://apis.data.go.kr https://openapi.map.naver.com",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 0,
    },
  },
  images: {
    remotePatterns: [
      // TourAPI / 공공데이터포털
      {
        protocol: "https",
        hostname: "*.data.go.kr",
      },
      {
        protocol: "http",
        hostname: "*.data.go.kr",
      },
      // 정부 도메인 전체
      {
        protocol: "https",
        hostname: "*.go.kr",
      },
      {
        protocol: "http",
        hostname: "*.go.kr",
      },
      // 한국관광공사
      {
        protocol: "https",
        hostname: "*.visitkorea.or.kr",
      },
      {
        protocol: "http",
        hostname: "*.visitkorea.or.kr",
      },
      // 고캠핑 API
      {
        protocol: "https",
        hostname: "gocamping.or.kr",
      },
      {
        protocol: "http",
        hostname: "gocamping.or.kr",
      },
      {
        protocol: "https",
        hostname: "*.gocamping.or.kr",
      },
      {
        protocol: "http",
        hostname: "*.gocamping.or.kr",
      },
      // 식품안전나라 (레시피 이미지)
      {
        protocol: "https",
        hostname: "foodsafetykorea.go.kr",
      },
      {
        protocol: "http",
        hostname: "foodsafetykorea.go.kr",
      },
      // 농촌진흥청 농사로 (향토음식 이미지)
      {
        protocol: "http",
        hostname: "www.nongsaro.go.kr",
      },
      {
        protocol: "https",
        hostname: "www.nongsaro.go.kr",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/:locale/travel/barrier-free", destination: "/:locale/travel", permanent: true },
      { source: "/:locale/travel/pet", destination: "/:locale/travel", permanent: true },
      { source: "/:locale/travel/barrier-free/:id", destination: "/:locale/travel/:id", permanent: true },
      { source: "/:locale/travel/pet/:id", destination: "/:locale/travel/:id", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
