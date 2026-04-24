"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lip/supabase-client";
import UserMenu from "./UserMenu";

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

  // لسه بنشيك على السيشن
  if (loggedIn === null) {
    return null;
  }

  // بعد تسجيل الدخول → menu ☰
  if (loggedIn) {
    return <UserMenu />;
  }

  // قبل تسجيل الدخول → login / signup
  return (
    <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
      <Link
        href="/login"
        className="flex min-h-[52px] items-center justify-center rounded-2xl bg-white px-3 py-2 text-center text-sm font-semibold leading-5 text-slate-700 ring-1 ring-slate-200 sm:rounded-full sm:px-4"
      >
        تسجيل الدخول
      </Link>

      <Link
        href="/login?mode=signup"
        className="flex min-h-[52px] items-center justify-center rounded-2xl bg-sky-600 px-3 py-2 text-center text-sm font-semibold leading-5 text-white sm:rounded-full sm:px-4"
      >
        إنشاء حساب
      </Link>
    </div>
  );
}