import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Share Bus | حجز رحلات يومية في القاهرة",
  description:
    "احجز رحلتك اليومية بسهولة مع Share Bus. نقاط تجمع مرنة، أسعار مناسبة، وتنقل مريح داخل القاهرة.",
  keywords: [
    "Share Bus",
    "حجز رحلات",
    "مواصلات القاهرة",
    "رحلات يومية",
    "نقل جماعي",
  ],
  authors: [{ name: "Share Bus" }],
  openGraph: {
    title: "Share Bus",
    description: "أفضل منصة لحجز الرحلات اليومية في القاهرة",
    url: "https://sharebus-eg.netlify.app",
    siteName: "Share Bus",
    images: [
      {
        url: "/sharebus-logo.png",
        width: 800,
        height: 600,
      },
    ],
    locale: "ar_EG",
    type: "website",
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta
          name="google-site-verification"
          content="Lvb6c3dXkC3_B_UPhSxx-FbccIlD-4n-nLUWOpjNAjY"
        />
      </head>

      <body className="bg-[#eef8ff] text-slate-900">
        {children}
      </body>
    </html>
  );
}