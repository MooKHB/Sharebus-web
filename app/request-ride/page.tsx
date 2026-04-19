"use client";

import { useState } from "react";
import { supabase } from "../lip/supabase-client";

function sanitizeEgyptPhoneInput(input: string) {
  let digits = input.replace(/\D/g, "");

  if (digits.startsWith("20")) {
    digits = digits.slice(2);
  }

  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  return digits.slice(0, 10);
}

function isValidEgyptMobile(input: string) {
  return /^(10|11|12|15)\d{8}$/.test(input);
}

export default function RequestRidePage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [requestedTime, setRequestedTime] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const fullNameError =
    submitted && !fullName.trim() ? "الاسم مطلوب" : "";

  const phoneError =
    submitted && !isValidEgyptMobile(phone)
      ? "اكتب رقم موبايل مصري صحيح"
      : "";

  const pickupError =
    submitted && !pickupLocation.trim() ? "مكان الركوب مطلوب" : "";

  const dropoffError =
    submitted && !dropoffLocation.trim() ? "مكان الوصول مطلوب" : "";

  const timeError =
    submitted && !requestedTime.trim() ? "الميعاد مطلوب" : "";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    setLoading(true);
    setMessage("");

    if (
      !fullName.trim() ||
      !isValidEgyptMobile(phone) ||
      !pickupLocation.trim() ||
      !dropoffLocation.trim() ||
      !requestedTime.trim()
    ) {
      setMessage("من فضلك املأ كل البيانات المطلوبة بشكل صحيح");
      setLoading(false);
      return;
    }

    const normalizedPhone = `+20${phone}`;

    const { error } = await supabase.from("ride_requests").insert({
      full_name: fullName,
      phone: normalizedPhone,
      pickup_location: pickupLocation,
      dropoff_location: dropoffLocation,
      requested_time: requestedTime,
      notes,
    });

    if (error) {
      setMessage("حصل خطأ أثناء إرسال الطلب");
      setLoading(false);
      return;
    }

    setMessage("تم إرسال طلبك بنجاح، وسنتواصل معك قريبًا");
    setFullName("");
    setPhone("");
    setPickupLocation("");
    setDropoffLocation("");
    setRequestedTime("");
    setNotes("");
    setSubmitted(false);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#eef8ff] px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-3xl rounded-[32px] bg-white/80 p-8 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
        <div className="mb-8">
          <p className="mb-3 inline-block rounded-full bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 ring-1 ring-sky-100">
            Request Ride
          </p>
          <h1 className="text-3xl font-bold md:text-4xl">
            اطلب رحلة غير موجودة
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            لو مش لاقي رحلتك، ابعت لنا منين راكب وإلى أين وميعادك المناسب.
          </p>
          <p className="mt-4 text-xs text-slate-500">
            الحقول اللي عليها <span className="text-red-500">*</span> مطلوبة
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                الاسم <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`w-full rounded-2xl border bg-white px-4 py-3 text-black outline-none placeholder:text-slate-400 ${
                  fullNameError
                    ? "border-red-400 focus:ring-4 focus:ring-red-100"
                    : "border-slate-200 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                }`}
                placeholder="اكتب اسمك"
                required
              />
              {fullNameError && (
                <p className="mt-2 text-xs text-red-500">{fullNameError}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                رقم التليفون <span className="text-red-500">*</span>
              </label>

              <div
                className={`flex items-center overflow-hidden rounded-2xl border bg-white ${
                  phoneError
                    ? "border-red-400 focus-within:ring-4 focus-within:ring-red-100"
                    : "border-slate-200 focus-within:border-sky-300 focus-within:ring-4 focus-within:ring-sky-100"
                }`}
              >
                <div className="flex items-center gap-2 border-l border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="text-lg">🇪🇬</span>
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
                  className="w-full bg-white px-4 py-3 text-black outline-none placeholder:text-slate-400"
                  placeholder="1XXXXXXXXX"
                  required
                />
              </div>

              {phoneError ? (
                <p className="mt-2 text-xs text-red-500">{phoneError}</p>
              ) : (
                <p className="mt-2 text-xs text-slate-400">
                  اكتب الرقم من غير 0 أو +20
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              هتركب منين؟ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              className={`w-full rounded-2xl border bg-white px-4 py-3 text-black outline-none placeholder:text-slate-400 ${
                pickupError
                  ? "border-red-400 focus:ring-4 focus:ring-red-100"
                  : "border-slate-200 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              }`}
              placeholder="مثال: مدينة نصر"
              required
            />
            {pickupError && (
              <p className="mt-2 text-xs text-red-500">{pickupError}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              رايح فين؟ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={dropoffLocation}
              onChange={(e) => setDropoffLocation(e.target.value)}
              className={`w-full rounded-2xl border bg-white px-4 py-3 text-black outline-none placeholder:text-slate-400 ${
                dropoffError
                  ? "border-red-400 focus:ring-4 focus:ring-red-100"
                  : "border-slate-200 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              }`}
              placeholder="مثال: مول العرب"
              required
            />
            {dropoffError && (
              <p className="mt-2 text-xs text-red-500">{dropoffError}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              الساعة كام؟ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={requestedTime}
              onChange={(e) => setRequestedTime(e.target.value)}
              className={`w-full rounded-2xl border bg-white px-4 py-3 text-black outline-none placeholder:text-slate-400 ${
                timeError
                  ? "border-red-400 focus:ring-4 focus:ring-red-100"
                  : "border-slate-200 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              }`}
              placeholder="مثال: 08:00 صباحًا"
              required
            />
            {timeError && (
              <p className="mt-2 text-xs text-red-500">{timeError}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">ملاحظات إضافية</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-black outline-none placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              placeholder="أي تفاصيل إضافية"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-sky-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-700 disabled:opacity-60"
          >
            {loading ? "جاري الإرسال..." : "إرسال الطلب"}
          </button>
        </form>

        <div className="mt-5 min-h-[64px] rounded-2xl bg-slate-50 px-4 py-3 text-center text-sm text-slate-700 ring-1 ring-slate-100 whitespace-pre-line">
          {message || "—"}
        </div>
      </div>
    </main>
  );
}