import type { ReactNode } from "react";
import type { Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  // The actual <html> and <body> are defined in app/[locale]/layout.tsx
  return children;
}
