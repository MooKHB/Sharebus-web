"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function createBrowserSupabase(rememberMe: boolean) {
  const storage = rememberMe ? window.localStorage : window.sessionStorage;

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storage,
    },
  });
}

function sanitizeEgyptPhoneInput(input: string) {
  let digits = input.replace(/\D/g, "");

  if (digits.startsWith("20")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);

  return digits.slice(0, 10);
}

function normalizeEgyptPhone(input: string) {
  const digits = sanitizeEgyptPhoneInput(input);
  return `+20${digits}`;
}

function isValidEgyptMobile(input: string) {
  const digits = sanitizeEgyptPhoneInput(input);
  return /^(10|11|12|15)\d{8}$/.test(digits);
}

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

type Mode = "login" | "signup";
type LoginType = "user" | "admin";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [loginType, setLoginType] = useState<LoginType>("user");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlMode = params.get("mode");
    setMode(urlMode === "signup" ? "signup" : "login");
  }, []);

  const passwordStrength = useMemo(
    () => getPasswordStrength(password),
    [password]
  );

  const fullNameError =
    submitted && mode === "signup" && !fullName.trim() ? "الاسم مطلوب" : "";

  const emailError =
    submitted &&
    ((mode === "signup" && !email.trim()) ||
      (mode === "login" && loginType === "admin" && !email.trim()))
      ? "الإيميل مطلوب"
      : "";

  const phoneError =
    submitted && mode === "signup" && !isValidEgyptMobile(phone)
      ? "اكتب رقم موبايل مصري صحيح"
      : "";

  const passwordError =
    submitted && !password.trim()
      ? "كلمة المرور مطلوبة"
      : submitted && mode === "signup" && password.length < 8
      ? "كلمة المرور لازم تكون 8 أحرف على الأقل"
      : "";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    setMessage("");

    const supabase = createBrowserSupabase(rememberMe);

    if (mode === "signup") {
      if (!fullName.trim()) {
        setMessage("من فضلك اكتب الاسم");
        return;
      }

      if (!email.trim()) {
        setMessage("من فضلك اكتب الإيميل");
        return;
      }

      if (!isValidEgyptMobile(phone)) {
        setMessage("من فضلك اكتب رقم موبايل مصري صحيح");
        return;
      }

      if (!password.trim()) {
        setMessage("من فضلك اكتب كلمة المرور");
        return;
      }

      if (password.length < 8) {
        setMessage("كلمة المرور لازم تكون 8 أحرف على الأقل");
        return;
      }

      setLoading(true);

      try {
        const normalizedPhone = normalizeEgyptPhone(phone);

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: normalizedPhone,
            },
          },
        });

        if (error) {
          setMessage(error.message || "حصل خطأ أثناء إنشاء الحساب");
          setLoading(false);
          return;
        }

        if (!data.user?.id) {
          setMessage("تم إنشاء الحساب لكن لم يتم استلام بيانات المستخدم");
          setLoading(false);
          return;
        }

        setMessage("تم تسجيل الدخول بنجاح ✔️");

        setTimeout(() => {
          window.location.href = "/";
        }, 800);
      } catch (err) {
        console.error(err);
        setMessage("حصل خطأ غير متوقع");
      }

      setLoading(false);
      return;
    }

    if (!password.trim()) {
      setMessage("من فضلك اكتب كلمة المرور");
      return;
    }

    setLoading(true);

    try {
      if (loginType === "admin") {
        if (!email.trim()) {
          setMessage("من فضلك اكتب إيميل الأدمن");
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setMessage(error.message || "بيانات الأدمن غير صحيحة");
          setLoading(false);
          return;
        }

        window.location.href = "/admin";
        return;
      }

      if (email.trim()) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setMessage(error.message || "الإيميل أو كلمة المرور غير صحيحة");
          setLoading(false);
          return;
        }

        window.location.href = "/";
        return;
      }

      if (!isValidEgyptMobile(phone)) {
        setMessage("اكتب الإيميل أو رقم موبايل صحيح");
        setLoading(false);
        return;
      }

      const normalizedPhone = normalizeEgyptPhone(phone);

      const { error } = await supabase.auth.signInWithPassword({
        phone: normalizedPhone,
        password,
      });

      if (error) {
        setMessage("رقم التليفون أو كلمة المرور غير صحيحة");
        setLoading(false);
        return;
      }

      window.location.href = "/";
    } catch (err) {
      console.error(err);
      setMessage("حصل خطأ أثناء تسجيل الدخول");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#eef8ff] px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-md">
        <div className="rounded-[32px] bg-white/80 p-8 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <div className="mb-8 text-center">
            <p className="mb-3 inline-block rounded-full bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 ring-1 ring-sky-100">
              {mode === "login" ? "أهلاً بعودتك" : "ابدأ مع ShareBus"}
            </p>

            <h1 className="text-3xl font-bold md:text-4xl">
              {mode === "login" ? "تسجيل الدخول" : "إنشاء حساب"}
            </h1>

            <p className="mt-3 text-sm leading-7 text-slate-500">
              {mode === "login"
                ? "سجّل دخولك ببياناتك لمتابعة رحلاتك أو الدخول للإدارة."
                : "أنشئ حسابك بالاسم والإيميل ورقم التليفون وكلمة المرور."}
            </p>

            <p className="mt-4 text-xs text-slate-500">
              الحقول اللي عليها <span className="text-red-500">*</span> مطلوبة
            </p>
          </div>

          {mode === "login" && (
            <div className="mb-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setLoginType("user");
                  setMessage("");
                  setSubmitted(false);
                }}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  loginType === "user"
                    ? "bg-sky-600 text-white shadow-lg"
                    : "bg-white text-slate-700 ring-1 ring-slate-200"
                }`}
              >
                دخول مستخدم
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginType("admin");
                  setMessage("");
                  setSubmitted(false);
                }}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  loginType === "admin"
                    ? "bg-slate-900 text-white shadow-lg"
                    : "bg-white text-slate-700 ring-1 ring-slate-200"
                }`}
              >
                دخول الأدمن
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "signup" && (
              <div>
                <label className="mb-2 block text-sm font-medium">
                  الاسم <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="اكتب اسمك"
                  className={`w-full rounded-2xl border bg-white px-4 py-3 text-black outline-none ${
                    fullNameError ? "border-red-400" : "border-slate-200"
                  }`}
                  required
                />
                {fullNameError && (
                  <p className="mt-2 text-xs text-red-500">{fullNameError}</p>
                )}
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium">
                الإيميل{" "}
                {mode === "signup" || loginType === "admin" ? (
                  <span className="text-red-500">*</span>
                ) : null}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className={`w-full rounded-2xl border bg-white px-4 py-3 text-black outline-none ${
                  emailError ? "border-red-400" : "border-slate-200"
                }`}
              />
              {mode === "login" && loginType === "user" && (
                <p className="mt-2 text-xs text-slate-400">
                  في تسجيل الدخول للمستخدم، ممكن تدخل بالإيميل أو بالموبايل
                </p>
              )}
              {emailError && (
                <p className="mt-2 text-xs text-red-500">{emailError}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                رقم التليفون{" "}
                {mode === "signup" ? (
                  <span className="text-red-500">*</span>
                ) : null}
              </label>

              <div
                className={`flex items-center overflow-hidden rounded-2xl border bg-white ${
                  phoneError ? "border-red-400" : "border-slate-200"
                }`}
              >
                <div className="flex items-center gap-2 border-l border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="text-sm font-medium text-slate-600">EG</span>
                  <span className="text-sm font-medium text-slate-600">+20</span>
                </div>

                <input
                  type="tel"
                  dir="ltr"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) =>
                    setPhone(sanitizeEgyptPhoneInput(e.target.value))
                  }
                  placeholder="1XXXXXXXXX"
                  className="w-full bg-white px-4 py-3 text-black outline-none"
                />
              </div>

              {phoneError && (
                <p className="mt-2 text-xs text-red-500">{phoneError}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                كلمة المرور <span className="text-red-500">*</span>
              </label>

              <div
                className={`flex items-center overflow-hidden rounded-2xl border bg-white ${
                  passwordError ? "border-red-400" : "border-slate-200"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="px-4 text-slate-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="اكتب كلمة المرور"
                  className="w-full bg-white px-4 py-3 text-black outline-none"
                  required
                />
              </div>

              {passwordError && (
                <p className="mt-2 text-xs text-red-500">{passwordError}</p>
              )}

              {mode === "signup" && password && (
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

            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              تذكرني
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-sky-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-700 disabled:opacity-60"
            >
              {loading
                ? "جاري التنفيذ..."
                : mode === "login"
                ? "تسجيل الدخول"
                : "إنشاء حساب"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => (window.location.href = "/reset-password")}
              className="text-sm font-medium text-sky-600 transition hover:text-sky-700"
            >
              نسيت كلمة المرور؟
            </button>
          </div>

          <div className="mt-5 min-h-[64px] whitespace-pre-line rounded-2xl bg-slate-50 px-4 py-3 text-center text-sm text-slate-700 ring-1 ring-slate-100">
            {message || "—"}
          </div>

          <div className="mt-6 text-center text-sm">
            {mode === "login" ? (
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setLoginType("user");
                  setMessage("");
                  setSubmitted(false);
                }}
                className="font-medium text-sky-600 transition hover:text-sky-700"
              >
                ماعندكش حساب؟ أنشئ حساب جديد
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setMessage("");
                  setSubmitted(false);
                }}
                className="font-medium text-sky-600 transition hover:text-sky-700"
              >
                عندك حساب بالفعل؟ سجّل دخول
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}