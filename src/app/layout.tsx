import type { Metadata } from "next";
import "./globals.css";
import { Geist, Plus_Jakarta_Sans } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "Trip Bite",
  description: "여행지, 맛집, 캠핑장, 특산품, 레시피를 한입에",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "https://trip-bite.vercel.app"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={cn("font-sans", geist.variable, jakarta.variable)}>
      <head>
        <meta name="description" content="여행지, 맛집, 캠핑장, 특산품, 레시피를 한입에" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
