import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GameForge",
  description: "AI-powered game asset generation platform",
};

/**
 * 루트 layout — [locale]/layout.tsx가 실제 렌더링 담당.
 * 미들웨어가 /en 또는 /ko로 redirect하므로 이 layout은
 * html/body 없이 children만 pass-through.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
