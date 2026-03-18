import type { Metadata } from "next";
import "./globals.css";
import { GeistSans } from "geist/font/sans";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "여행한입 | Trip Bite",
  description: "여행지, 맛집, 캠핑장, 특산품, 레시피를 한입에",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "https://trip-bite.vercel.app"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={cn("font-sans", GeistSans.variable)}>
      <head>
        <meta name="description" content="여행지, 맛집, 캠핑장, 특산품, 레시피를 한입에" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
