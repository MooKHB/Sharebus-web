"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lip/supabase-client";

export default function NavAuth() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setLoggedIn(Boolean(session?.user));
    }

    checkSession();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(Boolean(session?.user));
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  if (loggedIn === null) {
    return null;
  }

  if (loggedIn) {
    return (
      <Link
        href="/profile"
        className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white"
      >
        حسابي
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200"
      >
        تسجيل الدخول
      </Link>

      <Link
        href="/login?mode=signup"
        className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white"
      >
        إنشاء حساب
      </Link>
    </div>
  );
}