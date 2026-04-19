"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lip/supabase-client";

type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
};

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;
      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, email")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error(error);
      }

      const fallbackProfile: Profile = {
        id: user.id,
        full_name:
          data?.full_name ??
          (user.user_metadata?.full_name as string | null) ??
          null,
        phone:
          data?.phone ??
          (user.user_metadata?.phone as string | null) ??
          (user.phone as string | null) ??
          null,
        email: data?.email ?? user.email ?? null,
      };

      setProfile(fallbackProfile);
      setLoading(false);
    }

    loadProfile();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#eef8ff] px-6 py-12 text-slate-900">
        <div className="mx-auto max-w-4xl rounded-[32px] bg-white/80 p-8 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          جاري تحميل البيانات...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eef8ff] px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-[32px] bg-white/80 p-8 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-3 inline-block rounded-full bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 ring-1 ring-sky-100">
                الملف الشخصي
              </p>
              <h1 className="text-3xl font-bold md:text-4xl">حسابي</h1>
              <p className="mt-2 text-sm text-slate-500">
                تابع بياناتك ووصل سريعًا إلى رحلاتك واشتراكاتك.
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 ring-1 ring-slate-200 transition hover:bg-slate-50"
            >
              تسجيل الخروج
            </button>
          </div>

          <div className="mb-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[28px] bg-slate-50/80 p-5 ring-1 ring-slate-100">
              <p className="text-sm text-slate-500">الاسم</p>
              <p className="mt-2 text-xl font-bold">
                {profile?.full_name || "—"}
              </p>
            </div>

            <div className="rounded-[28px] bg-slate-50/80 p-5 ring-1 ring-slate-100">
              <p className="text-sm text-slate-500">رقم التليفون</p>
              <p className="mt-2 text-xl font-bold">
                {profile?.phone || "—"}
              </p>
            </div>

            <div className="rounded-[28px] bg-slate-50/80 p-5 ring-1 ring-slate-100 md:col-span-2">
              <p className="text-sm text-slate-500">الإيميل</p>
              <p className="mt-2 text-lg font-semibold">
                {profile?.email || "غير مضاف"}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Link
              href="/my-bookings"
              className="rounded-[28px] bg-sky-600 px-6 py-5 text-center text-base font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-700"
            >
              رحلاتي
            </Link>

            <Link
              href="/subscriptions"
              className="rounded-[28px] bg-slate-900 px-6 py-5 text-center text-base font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800"
            >
              اشتراكاتي
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}