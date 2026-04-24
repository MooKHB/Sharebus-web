import type { Metadata } from "next";
import Link from "next/link";
import AdminLogoutButton from "./AdminLogoutButton";

export const metadata: Metadata = {
  title: "Admin Dashboard - Share Bus",
  description: "",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="bg-[#eef8ff] px-6 pt-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-3xl bg-white/80 p-4 shadow-sm ring-1 ring-white/70">
          <Link href="/admin" className="font-bold text-slate-900">
            Share Bus Admin
          </Link>

          <AdminLogoutButton />
        </div>
      </div>

      {children}
    </>
  );
}