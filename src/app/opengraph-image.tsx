import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "여행한입 - 대한민국 여행 & 먹거리 탐색";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #78350f 0%, #92400e 50%, #b45309 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#fef3c7",
            marginBottom: 16,
            letterSpacing: "-2px",
          }}
        >
          여행한입
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#fde68a",
            fontWeight: 400,
          }}
        >
          Trip Bite
        </div>
        <div
          style={{
            fontSize: 24,
            color: "#fef9c3",
            marginTop: 24,
            opacity: 0.85,
          }}
        >
          대한민국 여행지 · 맛집 · 캠핑장 · 특산품 · 레시피
        </div>
      </div>
    ),
    { ...size }
  );
}
