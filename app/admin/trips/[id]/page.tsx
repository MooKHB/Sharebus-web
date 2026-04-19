"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lip/supabase-client";

export default function EditTripPage({
  params,
}: {
  params: { id: string };
}) {
  const tripId = Number(params.id);

  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [timeText, setTimeText] = useState("");
  const [price, setPrice] = useState("");
  const [durationText, setDurationText] = useState("");
  const [description, setDescription] = useState("");
  const [badge, setBadge] = useState("متاحة");
  const [badgeColor, setBadgeColor] = useState("sky");
  const [isActive, setIsActive] = useState(true);
  const [allowWeeklySubscription, setAllowWeeklySubscription] = useState(false);
  const [allowMonthlySubscription, setAllowMonthlySubscription] = useState(false);
  const [weeklyPrice, setWeeklyPrice] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadTrip() {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .eq("id", tripId)
        .single();

      if (error || !data) return;

      setFromLocation(data.from_location ?? "");
      setToLocation(data.to_location ?? "");
      setTimeText(data.time_text ?? "");
      setPrice(String(data.price ?? ""));
      setDurationText(data.duration_text ?? "");
      setDescription(data.description ?? "");
      setBadge(data.badge ?? "متاحة");
      setBadgeColor(data.badge_color ?? "sky");
      setIsActive(!!data.is_active);
      setAllowWeeklySubscription(!!data.allow_weekly_subscription);
      setAllowMonthlySubscription(!!data.allow_monthly_subscription);
      setWeeklyPrice(data.weekly_price ? String(data.weekly_price) : "");
      setMonthlyPrice(data.monthly_price ? String(data.monthly_price) : "");
    }

    loadTrip();
  }, [tripId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase
      .from("trips")
      .update({
        from_location: fromLocation,
        to_location: toLocation,
        time_text: timeText,
        price: Number(price),
        duration_text: durationText,
        description,
        badge,
        badge_color: badgeColor,
        is_active: isActive,
        allow_weekly_subscription: allowWeeklySubscription,
        allow_monthly_subscription: allowMonthlySubscription,
        weekly_price: allowWeeklySubscription && weeklyPrice ? Number(weeklyPrice) : null,
        monthly_price: allowMonthlySubscription && monthlyPrice ? Number(monthlyPrice) : null,
      })
      .eq("id", tripId);

    if (error) {
      console.error(error);
      setMessage("حصل خطأ أثناء تحديث الرحلة");
      setLoading(false);
      return;
    }

    setMessage("تم تحديث الرحلة بنجاح");
    setLoading(false);
  }

  async function handleDelete() {
    const confirmed = window.confirm("هل أنت متأكد من حذف الرحلة؟");
    if (!confirmed) return;

    const { error } = await supabase.from("trips").delete().eq("id", tripId);

    if (error) {
      alert("تعذر حذف الرحلة. غالبًا يوجد حجوزات مرتبطة بها.");
      return;
    }

    window.location.href = "/admin/trips";
  }

  return (
    <main className="min-h-screen bg-[#eef8ff] px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-4xl rounded-[32px] bg-white/80 p-8 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">تعديل الرحلة</h1>

          <button
            onClick={handleDelete}
            className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white"
          >
            حذف الرحلة
          </button>
        </div>

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
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            الرحلة مفعلة
          </label>

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

          <button type="submit" disabled={loading} className="w-full rounded-2xl bg-sky-600 px-6 py-4 text-white">
            {loading ? "جاري الحفظ..." : "حفظ التعديلات"}
          </button>
        </form>

        <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-center text-sm ring-1 ring-slate-100">
          {message || "—"}
        </div>
      </div>
    </main>
  );
}