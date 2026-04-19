"use client";

import { useState } from "react";
import { supabase } from "../lip/supabase-client";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const emailError =
    submitted && !email.trim() ? "الإيميل مطلوب" : "";

  async function handleReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    setLoading(true);
    setMessage("");

    if (!email.trim()) {
      setMessage("من فضلك اكتب الإيميل");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "http://localhost:3000/update-password",
    });

    if (error) {
      setMessage("حصل خطأ أثناء إرسال رابط تغيير كلمة المرور");
    } else {
      setMessage(
        "تم إرسال رابط إعادة تعيين كلمة المرور على الإيميل.\nلو ملقيتش الرسالة، راجع Spam."
      );
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#eef8ff] px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-md">
        <div className="rounded-[32px] bg-white/80 p-8 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <div className="mb-8 text-center">
            <p className="mb-3 inline-block rounded-full bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 ring-1 ring-sky-100">
              استرجاع كلمة المرور
            </p>

            <h1 className="text-3xl font-bold md:text-4xl">
              نسيت كلمة المرور؟
            </h1>

            <p className="mt-3 text-sm leading-7 text-slate-500">
              اكتب الإيميل المرتبط بحسابك، وهنبعتلك رابط تغيّر منه كلمة المرور.
            </p>

            <p className="mt-4 text-xs text-slate-500">
              الحقول اللي عليها <span className="text-red-500">*</span> مطلوبة
            </p>
          </div>

          <form onSubmit={handleReset} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium">
                الإيميل <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="اكتب الإيميل"
                className={`w-full rounded-2xl border bg-white px-4 py-3 text-black outline-none placeholder:text-slate-400 ${
                  emailError
                    ? "border-red-400 focus:ring-4 focus:ring-red-100"
                    : "border-slate-200 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                }`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {emailError && (
                <p className="mt-2 text-xs text-red-500">{emailError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-sky-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-700 disabled:opacity-60"
            >
              {loading ? "جاري الإرسال..." : "إرسال الرابط"}
            </button>
          </form>

          <div className="mt-5 min-h-[64px] rounded-2xl bg-slate-50 px-4 py-3 text-center text-sm text-slate-700 ring-1 ring-slate-100 whitespace-pre-line">
            {message || "—"}
          </div>
        </div>
      </div>
    </main>
  );
}