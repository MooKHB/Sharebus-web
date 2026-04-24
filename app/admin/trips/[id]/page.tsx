"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
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

const paymentMethodOptions = [
  { key: "cash", label: "كاش" },
  { key: "instapay", label: "انستا باي" },
];

export default function EditTripPage() {
  const params = useParams();
  const tripId = useMemo(() => Number(params?.id), [params]);

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
  const [supportsRoundTrip, setSupportsRoundTrip] = useState(false);
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>(["cash", "instapay"]);

  const [reverseTripId, setReverseTripId] = useState<number | null>(null);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function toggleDay(day: string) {
    setAvailableDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function togglePaymentMethod(method: string) {
    setPaymentMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
  }

  useEffect(() => {
    async function loadTrip() {
      if (!tripId || Number.isNaN(tripId)) return;

      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .eq("id", tripId)
        .single();

      if (error || !data) {
        setMessage("تعذر تحميل الرحلة");
        return;
      }

      setFromLocation(data.from_location ?? "");
      setToLocation(data.to_location ?? "");
      setTimeText(data.time_text ?? "");
      setPrice(data.price !== null && data.price !== undefined ? String(data.price) : "");
      setDurationText(data.duration_text ?? "");
      setDescription(data.description ?? "");
      setBadge(data.badge ?? "متاحة");
      setBadgeColor(data.badge_color ?? "sky");
      setIsActive(Boolean(data.is_active));
      setAllowWeeklySubscription(Boolean(data.allow_weekly_subscription));
      setAllowMonthlySubscription(Boolean(data.allow_monthly_subscription));
      setWeeklyPrice(
        data.weekly_price !== null && data.weekly_price !== undefined
          ? String(data.weekly_price)
          : ""
      );
      setMonthlyPrice(
        data.monthly_price !== null && data.monthly_price !== undefined
          ? String(data.monthly_price)
          : ""
      );
      setSupportsRoundTrip(Boolean(data.supports_round_trip));
      setReverseTripId(data.reverse_trip_id ?? null);
      setAvailableDays(
        Array.isArray(data.available_days) && data.available_days.length > 0
          ? data.available_days
          : ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
      );
      setPaymentMethods(
        Array.isArray(data.payment_methods) && data.payment_methods.length > 0
          ? data.payment_methods
          : ["cash", "instapay"]
      );
    }

    loadTrip();
  }, [tripId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!tripId || Number.isNaN(tripId)) {
      setMessage("رقم الرحلة غير صحيح");
      setLoading(false);
      return;
    }

    if (availableDays.length === 0) {
      setMessage("اختر يوم متاح واحد على الأقل");
      setLoading(false);
      return;
    }

    if (paymentMethods.length === 0) {
      setMessage("اختر طريقة دفع واحدة على الأقل");
      setLoading(false);
      return;
    }

    const safePrice = Number(price);
    const safeWeeklyPrice =
      allowWeeklySubscription && weeklyPrice.trim() !== ""
        ? Number(weeklyPrice)
        : null;
    const safeMonthlyPrice =
      allowMonthlySubscription && monthlyPrice.trim() !== ""
        ? Number(monthlyPrice)
        : null;

    const { error } = await supabase
      .from("trips")
      .update({
        from_location: fromLocation.trim(),
        to_location: toLocation.trim(),
        time_text: timeText.trim(),
        price: safePrice,
        duration_text: durationText.trim(),
        description: description.trim() || "",
        badge: badge.trim() || "متاحة",
        badge_color: badgeColor.trim() || "sky",
        is_active: isActive,
        allow_weekly_subscription: allowWeeklySubscription,
        allow_monthly_subscription: allowMonthlySubscription,
        weekly_price: allowWeeklySubscription ? safeWeeklyPrice : null,
        monthly_price: allowMonthlySubscription ? safeMonthlyPrice : null,
        supports_round_trip: supportsRoundTrip,
        available_days: availableDays,
        payment_methods: paymentMethods,
      })
      .eq("id", tripId);

    if (error) {
      setMessage(`حصل خطأ أثناء تحديث الرحلة: ${error.message}`);
      setLoading(false);
      return;
    }

    setMessage("تم تحديث الرحلة بنجاح");
    setLoading(false);
  }

  async function handleDelete() {
    if (!tripId || Number.isNaN(tripId)) return;

    const confirmed = window.confirm("هل أنت متأكد من حذف الرحلة؟");
    if (!confirmed) return;

    const { error } = await supabase.from("trips").delete().eq("id", tripId);

    if (error) {
      alert("تعذر حذف الرحلة. غالبًا توجد بيانات مرتبطة بها.");
      return;
    }

    window.location.href = "/admin/trips";
  }

  return (
    <main className="min-h-screen bg-[#eef8ff] px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-4xl rounded-[32px] bg-white/80 p-8 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">تعديل الرحلة</h1>

          <button
            onClick={handleDelete}
            className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white"
            type="button"
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

          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="mb-3 text-sm font-semibold">طرق الدفع المتاحة لهذه الرحلة</p>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethodOptions.map((method) => (
                <button
                  key={method.key}
                  type="button"
                  onClick={() => togglePaymentMethod(method.key)}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    paymentMethods.includes(method.key)
                      ? "bg-sky-600 text-white"
                      : "bg-white text-slate-700 ring-1 ring-slate-200"
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            الرحلة مفعلة
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={supportsRoundTrip}
              onChange={(e) => setSupportsRoundTrip(e.target.checked)}
            />
            الرحلة تدعم ذهاب وعودة
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

          {reverseTripId && (
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm ring-1 ring-slate-100">
              الرحلة العكسية مرتبطة بالرقم: <span className="font-bold">{reverseTripId}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-sky-600 px-6 py-4 text-white"
          >
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