import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Game Assets Maker",
  description: "AI-powered game asset generation platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
