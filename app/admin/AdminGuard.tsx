"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lip/supabase-client";

const ADMIN_EMAIL = "mohamed.k.basheer@gmail.com";

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAdmin() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      if (user.email === ADMIN_EMAIL) {
        setAllowed(true);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, email")
        .eq("id", user.id)
        .single();

      if (profile?.role === "admin" || profile?.email === ADMIN_EMAIL) {
        setAllowed(true);
        return;
      }

      window.location.href = "/";
    }

    checkAdmin();
  }, []);

  if (allowed === null) {
    return (
      <main className="min-h-screen bg-[#eef8ff] px-6 py-12 text-center text-slate-900">
        <div className="mx-auto max-w-lg rounded-[32px] bg-white p-8 shadow-xl">
          جاري التحقق من صلاحيات الأدمن...
        </div>
      </main>
    );
  }

  return <>{children}</>;
}