"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lip/supabase-client";

type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
};

export default function NavAuth() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const currentUser = session?.user ?? null;
      setUser(currentUser ? { id: currentUser.id } : null);

      if (currentUser) {
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name, phone")
          .eq("id", currentUser.id)
          .maybeSingle();

        setProfile(data ?? null);
      }

      setLoading(false);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser ? { id: currentUser.id } : null);

      if (currentUser) {
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name, phone")
          .eq("id", currentUser.id)
          .maybeSingle();

        setProfile(data ?? null);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="hidden md:block">
        <div className="rounded-full bg-slate-200 px-5 py-2.5 text-sm">
          ...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="hidden items-center gap-3 md:flex">
        <Link
          href="/login"
          className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-slate-900 ring-1 ring-slate-200 transition hover:bg-slate-50"
        >
          تسجيل الدخول
        </Link>

        <Link
          href="/login?mode=signup"
          className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-sky-600"
        >
          إنشاء حساب جديد
        </Link>
      </div>
    );
  }

  return (
    <div className="hidden md:block">
      <Link
        href="/profile"
        className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-sky-600"
      >
        {profile?.full_name ? `حسابي` : "حسابي"}
      </Link>
    </div>
  );
}