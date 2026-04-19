"use client";

import { useState } from "react";
import { supabase } from "../../../lip/supabase-client";

export default function NewTripPage() {
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [timeText, setTimeText] = useState("");
  const [price, setPrice] = useState("");
  const [durationText, setDurationText] = useState("");
  const [description, setDescription] = useState("");
  const [badge, setBadge] = useState("متاحة");
  const [badgeColor, setBadgeColor] = useState("sky");
  const [allowWeeklySubscription, setAllowWeeklySubscription] = useState(false);
  const [allowMonthlySubscription, setAllowMonthlySubscription] = useState(false);
  const [weeklyPrice, setWeeklyPrice] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  setLoading(true);
  setMessage("");

  const { data: createdTrip, error } = await supabase
    .from("trips")
    .insert({
      from_location: fromLocation,
      to_location: toLocation,
      time_text: timeText,
      price: Number(price),
      duration_text: durationText,
      description,
      badge,
      badge_color: badgeColor,
      allow_weekly_subscription: allowWeeklySubscription,
      allow_monthly_subscription: allowMonthlySubscription,
      weekly_price: allowWeeklySubscription && weeklyPrice ? Number(weeklyPrice) : null,
      monthly_price: allowMonthlySubscription && monthlyPrice ? Number(monthlyPrice) : null,
      supports_round_trip: false,
      is_active: true,
    })
    .select()
    .single();

  if (error || !createdTrip) {
    console.error(error);
    setMessage("حصل خطأ أثناء إضافة الرحلة");
    setLoading(false);
    return;
  }

  setMessage("تمت إضافة الرحلة بنجاح");
  setLoading(false);
}

  return (
    <main className="min-h-screen bg-[#eef8ff] px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-4xl rounded-[32px] bg-white/80 p-8 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
        <h1 className="mb-6 text-3xl font-bold">إضافة رحلة جديدة</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input value={fromLocation} onChange={(e) => setFromLocation(e.target.value)} placeholder="من" className="w-full rounded-2xl border border-slate-200 px-4 py-3" required />
          <input value={toLocation} onChange={(e) => setToLocation(e.target.value)} placeholder="إلى" className="w-full rounded-2xl border border-slate-200 px-4 py-3" required />
          <input value={timeText} onChange={(e) => setTimeText(e.target.value)} placeholder="الوقت" className="w-full rounded-2xl border border-slate-200 px-4 py-3" required />
          <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="السعر الأساسي" type="number" className="w-full rounded-2xl border border-slate-200 px-4 py-3" required />
          <input value={durationText} onChange={(e) => setDurationText(e.target.value)} placeholder="المدة" className="w-full rounded-2xl border border-slate-200 px-4 py-3" required />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="الوصف" className="min-h-[120px] w-full rounded-2xl border border-slate-200 px-4 py-3" />
          <input value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="Badge" className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
          <input value={badgeColor} onChange={(e) => setBadgeColor(e.target.value)} placeholder="Badge Color" className="w-full rounded-2xl border border-slate-200 px-4 py-3" />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={allowWeeklySubscription}
              onChange={(e) => setAllowWeeklySubscription(e.target.checked)}
            />
            السماح بالاشتراك الأسبوعي
          </label>

          {allowWeeklySubscription && (
            <input
              value={weeklyPrice}
              onChange={(e) => setWeeklyPrice(e.target.value)}
              placeholder="سعر الاشتراك الأسبوعي"
              type="number"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            />
          )}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={allowMonthlySubscription}
              onChange={(e) => setAllowMonthlySubscription(e.target.checked)}
            />
            السماح بالاشتراك الشهري
          </label>

          {allowMonthlySubscription && (
            <input
              value={monthlyPrice}
              onChange={(e) => setMonthlyPrice(e.target.value)}
              placeholder="سعر الاشتراك الشهري"
              type="number"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-sky-600 px-6 py-4 text-white"
          >
            {loading ? "جاري الحفظ..." : "حفظ الرحلة"}
          </button>
        </form>

        <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-center text-sm ring-1 ring-slate-100">
          {message || "—"}
        </div>
      </div>
    </main>
  );
}