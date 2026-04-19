"use client";

import { useState } from "react";
import { supabase } from "../lip/supabase-client";

export default function TestOtpPage() {
  const [phone, setPhone] = useState("+201125817014");
  const [message, setMessage] = useState("");

  async function sendOtp() {
    setMessage("جاري الإرسال...");

    const { error } = await supabase.auth.signInWithOtp({
      phone,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("تم إرسال OTP بنجاح");
  }

  return (
    <main className="min-h-screen bg-[#eef8ff] px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-md rounded-[32px] bg-white/80 p-8 shadow-xl ring-1 ring-white/70 backdrop-blur">
        <h1 className="mb-6 text-2xl font-bold">تجربة OTP</h1>

        <label className="mb-2 block text-sm font-medium">رقم الموبايل</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mb-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
        />

        <button
          onClick={sendOtp}
          className="w-full rounded-2xl bg-sky-600 px-6 py-4 text-base font-semibold text-white transition hover:bg-sky-700"
        >
          إرسال OTP
        </button>

        {message && (
          <p className="mt-4 text-center text-sm text-slate-600">{message}</p>
        )}
      </div>
    </main>
  );
}