"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lip/supabase-client";
import { Eye, EyeOff } from "lucide-react";

function getPasswordStrength(password: string) {
  if (!password) return { label: "", color: "", width: "0%" };

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) || /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { label: "ضعيفة", color: "bg-red-500", width: "25%" };
  if (score === 2) return { label: "مقبولة", color: "bg-amber-500", width: "50%" };
  if (score === 3) return { label: "جيدة", color: "bg-sky-500", width: "75%" };
  return { label: "قوية", color: "bg-emerald-500", width: "100%" };
}

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [ready, setReady] = useState(false);

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  useEffect(() => {
    async function initRecoverySession() {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.replace("#", ""));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          setMessage("الرابط غير صالح أو منتهي");
          return;
        }
      }

      setReady(true);
    }

    initRecoverySession();
  }, []);

  const passwordError =
    submitted && !password.trim()
      ? "كلمة المرور الجديدة مطلوبة"
      : submitted && password.length < 8
      ? "كلمة المرور لازم تكون 8 أحرف على الأقل"
      : "";

  const confirmPasswordError =
    submitted && !confirmPassword.trim()
      ? "تأكيد كلمة المرور مطلوب"
      : submitted && password !== confirmPassword
      ? "كلمتا المرور غير متطابقتين"
      : "";

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    setLoading(true);
    setMessage("");

    if (!password.trim()) {
      setMessage("من فضلك اكتب كلمة المرور الجديدة");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setMessage("كلمة المرور لازم تكون 8 أحرف على الأقل");
      setLoading(false);
      return;
    }

    if (!confirmPassword.trim()) {
      setMessage("من فضلك أكد كلمة المرور");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage("كلمتا المرور غير متطابقتين");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      console.error(error);
      setMessage(`حصل خطأ أثناء تغيير كلمة المرور: ${error.message}`);
    } else {
      setMessage("تم تغيير كلمة المرور بنجاح ✔️");
      setPassword("");
      setConfirmPassword("");
      setSubmitted(false);
    }

    setLoading(false);
  }

  if (!ready) {
    return (
      <main className="min-h-screen bg-[#eef8ff] px-6 py-12 text-slate-900">
        <div className="mx-auto max-w-md rounded-[32px] bg-white/80 p-8 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          جاري تجهيز جلسة استعادة كلمة المرور...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eef8ff] px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-md">
        <div className="rounded-[32px] bg-white/80 p-8 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <div className="mb-8 text-center">
            <p className="mb-3 inline-block rounded-full bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 ring-1 ring-sky-100">
              تغيير كلمة المرور
            </p>

            <h1 className="text-3xl font-bold md:text-4xl">كلمة مرور جديدة</h1>

            <p className="mt-3 text-sm leading-7 text-slate-500">
              اكتب كلمة مرور جديدة قوية وسهلة تتذكرها.
            </p>
          </div>

          <form onSubmit={handleUpdate} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium">
                كلمة المرور الجديدة <span className="text-red-500">*</span>
              </label>

              <div className={`flex items-center overflow-hidden rounded-2xl border bg-white ${passwordError ? "border-red-400" : "border-slate-200"}`}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="اكتب الباسورد الجديد"
                  className="w-full bg-white px-4 py-3 text-black outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="px-4 text-slate-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {password && (
                <div className="mt-3">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-slate-500">قوة كلمة المرور</span>
                    <span className="font-medium text-slate-700">
                      {passwordStrength.label}
                    </span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: passwordStrength.width }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                تأكيد كلمة المرور <span className="text-red-500">*</span>
              </label>

              <div className={`flex items-center overflow-hidden rounded-2xl border bg-white ${confirmPasswordError ? "border-red-400" : "border-slate-200"}`}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="أعد كتابة الباسورد"
                  className="w-full bg-white px-4 py-3 text-black outline-none"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="px-4 text-slate-500"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-sky-600 px-6 py-4 text-base font-semibold text-white"
            >
              {loading ? "جاري التحديث..." : "تحديث كلمة المرور"}
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