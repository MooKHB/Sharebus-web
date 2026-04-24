"use client";

import { useState } from "react";
import { supabase } from "../lip/supabase-client";

export default function AdminLogoutButton() {
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
    >
      {loading ? "جاري الخروج..." : "تسجيل الخروج"}
    </button>
  );
}