import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Share Bus - شير باص",
  description: "Smart Daily Transport",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}