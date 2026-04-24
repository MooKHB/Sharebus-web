"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "../lip/supabase-client";

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div ref={menuRef} className="relative z-50">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-600 text-2xl font-bold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-700"
        aria-label="فتح القائمة"
      >
        ☰
      </button>

      {open && (
        <div className="absolute left-0 top-[68px] w-52 overflow-hidden rounded-3xl bg-white p-2 text-right shadow-2xl ring-1 ring-slate-200 sm:left-0">
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="block rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            حسابي
          </Link>

          <Link
            href="/my-bookings"
            onClick={() => setOpen(false)}
            className="block rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            حجوزاتي
          </Link>

          <Link
            href="/subscriptions"
            onClick={() => setOpen(false)}
            className="block rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            اشتراكاتي
          </Link>

          <button
            type="button"
            onClick={logout}
            className="block w-full rounded-2xl px-4 py-3 text-right text-sm font-bold text-red-600 hover:bg-red-50"
          >
            تسجيل الخروج
          </button>
        </div>
      )}
    </div>
  );
}