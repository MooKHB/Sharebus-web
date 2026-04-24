import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard - Share Bus",
  description: "",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}