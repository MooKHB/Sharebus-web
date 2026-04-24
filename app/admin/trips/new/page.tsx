"use client";

import { useState } from "react";
import { supabase } from "../../../lip/supabase-client";

const dayOptions = [
  { key: "sunday", label: "الأحد" },
  { key: "monday", label: "الاثنين" },
  { key: "tuesday", label: "الثلاثاء" },
  { key: "wednesday", label: "الأربعاء" },
  { key: "thursday", label: "الخميس" },
  { key: "friday", label: "الجمعة" },
  { key: "saturday", label: "السبت" },
];

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

  const [availableDays, setAvailableDays] = useState<string[]>([
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ]);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function toggleDay(day: string) {
    setAvailableDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const safePrice = Number(price);
      const safeWeeklyPrice =
        allowWeeklySubscription && weeklyPrice.trim() !== ""
          ? Number(weeklyPrice)
          : null;
      const safeMonthlyPrice =
        allowMonthlySubscription && monthlyPrice.trim() !== ""
          ? Number(monthlyPrice)
          : null;

      if (
        !fromLocation.trim() ||
        !toLocation.trim() ||
        !timeText.trim() ||
        !durationText.trim() ||
        Number.isNaN(safePrice)
      ) {
        setMessage("من فضلك املأ البيانات الأساسية بشكل صحيح");
        setLoading(false);
        return;
      }

      if (availableDays.length === 0) {
        setMessage("اختر يوم متاح واحد على الأقل");
        setLoading(false);
        return;
      }

      const payload = {
        from_location: fromLocation.trim(),
        to_location: toLocation.trim(),
        time_text: timeText.trim(),
        price: safePrice,
        duration_text: durationText.trim(),
        description: description.trim() || "",
        badge: badge.trim() || "متاحة",
        badge_color: badgeColor.trim() || "sky",
        is_active: true,
        allow_weekly_subscription: allowWeeklySubscription,
        allow_monthly_subscription: allowMonthlySubscription,
        weekly_price: allowWeeklySubscription ? safeWeeklyPrice : null,
        monthly_price: allowMonthlySubscription ? safeMonthlyPrice : null,
        supports_round_trip: false,
        available_days: availableDays,
      };

      const { error } = await supabase.from("trips").insert(payload);

      if (error) {
        console.error(error);
        setMessage(`حصل خطأ أثناء إضافة الرحلة: ${error.message}`);
        setLoading(false);
        return;
      }

      setMessage("تمت إضافة الرحلة بنجاح");
      setFromLocation("");
      setToLocation("");
      setTimeText("");
      setPrice("");
      setDurationText("");
      setDescription("");
      setBadge("متاحة");
      setBadgeColor("sky");
      setAllowWeeklySubscription(false);
      setAllowMonthlySubscription(false);
      setWeeklyPrice("");
      setMonthlyPrice("");
      setAvailableDays([
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ]);
    } catch (err) {
      console.error(err);
      setMessage("حصل خطأ غير متوقع أثناء إضافة الرحلة");
    }

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

          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="mb-3 text-sm font-semibold">الأيام المتاحة للرحلة</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {dayOptions.map((day) => (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => toggleDay(day.key)}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    availableDays.includes(day.key)
                      ? "bg-emerald-600 text-white"
                      : "bg-white text-slate-700 ring-1 ring-slate-200"
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

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

        <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-center text-sm ring-1 ring-slate-100 whitespace-pre-line">
          {message || "—"}
        </div>
      </div>
    </main>
  );
}