// app/layout.tsx

import type { Metadata } from "next";
import "./globals.css";

// 메타데이터 정의
export const metadata: Metadata = {
  title: "2025 Million Dollar Homepage",
  description: "Support an iOS app startup by buying pixels!",
};

// 루트 레이아웃 컴포넌트
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Pretendard 폰트 로드 */}
        <link
          href="https://cdn.jsdelivr.net/npm/pretendard@latest/dist/web/static/pretendard.css"
          rel="stylesheet"
        />
      </head>
      <body className="font-pretendard">
        {children}
      </body>
    </html>
  );
}