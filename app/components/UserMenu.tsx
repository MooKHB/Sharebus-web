"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "../lip/supabase-client";

export default function UserMenu() {
  const [open, setOpen] = useState(false);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-full bg-sky-600 px-4 py-2 text-white"
      >
        ☰
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-44 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-slate-200">
          <Link
            href="/profile"
            className="block rounded-xl px-4 py-2 text-sm hover:bg-slate-100"
          >
            حسابي
          </Link>

          <Link
            href="/my-bookings"
            className="block rounded-xl px-4 py-2 text-sm hover:bg-slate-100"
          >
            حجوزاتي
          </Link>

          <Link
            href="/subscriptions"
            className="block rounded-xl px-4 py-2 text-sm hover:bg-slate-100"
          >
            اشتراكاتي
          </Link>

          <button
            onClick={logout}
            className="block w-full rounded-xl px-4 py-2 text-right text-sm text-red-600 hover:bg-red-50"
          >
            تسجيل الخروج
          </button>
        </div>
      )}
    </div>
  );
}