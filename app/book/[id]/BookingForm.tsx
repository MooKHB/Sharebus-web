"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lip/supabase-client";

type TripSchedule = {
  id: number;
  trip_id: number;
  time_text: string;
};

type TripStop = {
  id: number;
  stop_name: string;
};

type UserProfile = {
  id: string;
  full_name: string | null;
  phone: string | null;
};

type BookingType = "one_way" | "round_trip" | "weekly" | "monthly";
type PaymentMethod = "cash" | "instapay";

export default function BookingForm({
  tripId,
  schedules,
  pickupStops,
  dropoffStops,
  price,
  allowWeeklySubscription,
  allowMonthlySubscription,
  weeklyPrice,
  monthlyPrice,
}: {
  tripId: number;
  schedules: TripSchedule[];
  pickupStops: TripStop[];
  dropoffStops: TripStop[];
  price: number;
  allowWeeklySubscription: boolean;
  allowMonthlySubscription: boolean;
  weeklyPrice: number | null;
  monthlyPrice: number | null;
}) {
  const [bookingDate, setBookingDate] = useState("");
  const [scheduleId, setScheduleId] = useState("");
  const [returnScheduleId, setReturnScheduleId] = useState("");
  const [pickupStopId, setPickupStopId] = useState("");
  const [dropoffStopId, setDropoffStopId] = useState("");

  const [seats, setSeats] = useState(1);
  const [bookingType, setBookingType] = useState<BookingType>("one_way");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");

  const [user, setUser] = useState<UserProfile | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) return;

      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, phone")
        .eq("id", session.user.id)
        .single();

      setUser(data);
    }

    loadUser();
  }, []);

  useEffect(() => {
    if (bookingType === "weekly" && !allowWeeklySubscription) {
      setBookingType("one_way");
    }

    if (bookingType === "monthly" && !allowMonthlySubscription) {
      setBookingType("one_way");
    }
  }, [bookingType, allowWeeklySubscription, allowMonthlySubscription]);

  const scheduleError = submitted && !scheduleId ? "معاد الذهاب مطلوب" : "";
  const bookingDateError = submitted && !bookingDate ? "تاريخ الحجز مطلوب" : "";
  const returnScheduleError =
    submitted && bookingType === "round_trip" && !returnScheduleId
      ? "موعد العودة مطلوب"
      : "";
  const pickupError = submitted && !pickupStopId ? "مكان الركوب مطلوب" : "";
  const dropoffError = submitted && !dropoffStopId ? "مكان النزول مطلوب" : "";

  const tripsCount = useMemo(() => {
    if (bookingType === "round_trip") return 2;
    if (bookingType === "weekly") return 5;
    if (bookingType === "monthly") return 22;
    return 1;
  }, [bookingType]);

  const total = useMemo(() => {
    const safePrice = Number(price) || 0;

    if (bookingType === "weekly") {
      const base = weeklyPrice !== null ? Number(weeklyPrice) : safePrice * 5;
      return base * seats;
    }

    if (bookingType === "monthly") {
      const base = monthlyPrice !== null ? Number(monthlyPrice) : safePrice * 22;
      return base * seats;
    }

    return safePrice * seats * tripsCount;
  }, [price, seats, tripsCount, bookingType, weeklyPrice, monthlyPrice]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    setMessage("");

    if (!user) {
      setMessage("لازم تسجل دخول الأول");
      return;
    }

    if (!bookingDate || !scheduleId || !pickupStopId || !dropoffStopId) {
      setMessage("من فضلك املأ كل البيانات المطلوبة");
      return;
    }

    if (bookingType === "round_trip" && !returnScheduleId) {
      setMessage("من فضلك اختار موعد العودة");
      return;
    }

    setLoading(true);

    const payload = {
      user_id: user.id,
      trip_id: tripId,
      booking_date: bookingDate,
      schedule_id: Number(scheduleId),
      return_schedule_id: returnScheduleId ? Number(returnScheduleId) : null,
      pickup_stop_id: Number(pickupStopId),
      dropoff_stop_id: Number(dropoffStopId),
      seats,
      status: "pending",
      payment_method: paymentMethod,
      booking_type: bookingType,
    };

    const { error } = await supabase.from("bookings").insert(payload);

    if (error) {
      console.error(error);
      setMessage("حصل خطأ أثناء تسجيل الحجز");
      setLoading(false);
      return;
    }

    setLoading(false);
    window.location.href = "/my-bookings";
  }

  const bookingOptions: { key: BookingType; label: string }[] = [
    { key: "one_way", label: "ذهاب فقط" },
    { key: "round_trip", label: "ذهاب وعودة" },
    ...(allowWeeklySubscription ? [{ key: "weekly" as BookingType, label: "اشتراك أسبوعي" }] : []),
    ...(allowMonthlySubscription ? [{ key: "monthly" as BookingType, label: "اشتراك شهري" }] : []),
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-[32px] bg-white/80 p-8 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur"
    >
      <div className="mb-2">
        <p className="mb-3 inline-block rounded-full bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 ring-1 ring-sky-100">
          تفاصيل الحجز
        </p>
        <h2 className="text-3xl font-bold md:text-4xl">اختيار تفاصيل الرحلة</h2>
        <p className="mt-3 text-xs text-slate-500">
          الحقول اللي عليها <span className="text-red-500">*</span> مطلوبة
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          تاريخ الحجز <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={bookingDate}
          onChange={(e) => setBookingDate(e.target.value)}
          className={`w-full rounded-2xl border bg-white px-4 py-3 text-black outline-none ${
            bookingDateError
              ? "border-red-400 focus:ring-4 focus:ring-red-100"
              : "border-slate-200 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
          }`}
          required
        />
        {bookingDateError && (
          <p className="mt-2 text-xs text-red-500">{bookingDateError}</p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          معاد الذهاب <span className="text-red-500">*</span>
        </label>
        <select
          value={scheduleId}
          onChange={(e) => setScheduleId(e.target.value)}
          className={`w-full rounded-2xl border bg-white px-4 py-3 text-black outline-none ${
            scheduleError
              ? "border-red-400 focus:ring-4 focus:ring-red-100"
              : "border-slate-200 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
          }`}
        >
          <option value="">اختر معاد الذهاب</option>
          {schedules.map((s) => (
            <option key={s.id} value={s.id}>
              {s.time_text}
            </option>
          ))}
        </select>
        {scheduleError && (
          <p className="mt-2 text-xs text-red-500">{scheduleError}</p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          موعد العودة {bookingType === "round_trip" && <span className="text-red-500">*</span>}
        </label>
        <select
          value={returnScheduleId}
          onChange={(e) => setReturnScheduleId(e.target.value)}
          className={`w-full rounded-2xl border bg-white px-4 py-3 text-black outline-none ${
            returnScheduleError
              ? "border-red-400 focus:ring-4 focus:ring-red-100"
              : "border-slate-200 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
          }`}
        >
          <option value="">اختر موعد العودة</option>
          {schedules.map((s) => (
            <option key={s.id} value={s.id}>
              {s.time_text}
            </option>
          ))}
        </select>
        {returnScheduleError && (
          <p className="mt-2 text-xs text-red-500">{returnScheduleError}</p>
        )}
      </div>

      <div className="rounded-2xl bg-sky-50 p-4 text-sm text-sky-700 ring-1 ring-sky-100">
        ملاحظة: في رحلة العودة، نقطة الالتقاء للعودة = نقطة النزول في الذهاب.
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          مكان الركوب <span className="text-red-500">*</span>
        </label>
        <select
          value={pickupStopId}
          onChange={(e) => setPickupStopId(e.target.value)}
          className={`w-full rounded-2xl border bg-white px-4 py-3 text-black outline-none ${
            pickupError
              ? "border-red-400 focus:ring-4 focus:ring-red-100"
              : "border-slate-200 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
          }`}
        >
          <option value="">اختر مكان الركوب</option>
          {pickupStops.map((stop) => (
            <option key={stop.id} value={stop.id}>
              {stop.stop_name}
            </option>
          ))}
        </select>
        {pickupError && (
          <p className="mt-2 text-xs text-red-500">{pickupError}</p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          مكان النزول <span className="text-red-500">*</span>
        </label>
        <select
          value={dropoffStopId}
          onChange={(e) => setDropoffStopId(e.target.value)}
          className={`w-full rounded-2xl border bg-white px-4 py-3 text-black outline-none ${
            dropoffError
              ? "border-red-400 focus:ring-4 focus:ring-red-100"
              : "border-slate-200 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
          }`}
        >
          <option value="">اختر مكان النزول</option>
          {dropoffStops.map((stop) => (
            <option key={stop.id} value={stop.id}>
              {stop.stop_name}
            </option>
          ))}
        </select>
        {dropoffError && (
          <p className="mt-2 text-xs text-red-500">{dropoffError}</p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          عدد الكراسي <span className="text-red-500">*</span>
        </label>
        <select
          value={seats}
          onChange={(e) => setSeats(Number(e.target.value))}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-black outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
        >
          {[1, 2, 3, 4, 5].map((seatCount) => (
            <option key={seatCount} value={seatCount}>
              {seatCount} {seatCount === 1 ? "كرسي" : "كراسي"}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="mb-3 font-semibold">
          نوع الحجز <span className="text-red-500">*</span>
        </p>
        <div className="grid grid-cols-2 gap-3">
          {bookingOptions.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setBookingType(item.key)}
              className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                bookingType === item.key
                  ? "bg-sky-600 text-white shadow-lg"
                  : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3 font-semibold">
          طريقة الدفع <span className="text-red-500">*</span>
        </p>
        <div className="flex gap-3">
          {[
            { key: "cash", label: "كاش" },
            { key: "instapay", label: "انستا باي" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setPaymentMethod(item.key as PaymentMethod)}
              className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                paymentMethod === item.key
                  ? "bg-emerald-600 text-white shadow-lg"
                  : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-sky-50 p-4 text-center">
        <p className="text-sm text-slate-500">إجمالي التكلفة</p>
        <p className="text-2xl font-bold text-sky-700">{total} EGP</p>
        <p className="mt-1 text-xs text-slate-400">
          {bookingType === "weekly"
            ? `سعر الاشتراك الأسبوعي ${weeklyPrice ?? price * 5} × ${seats}`
            : bookingType === "monthly"
            ? `سعر الاشتراك الشهري ${monthlyPrice ?? price * 22} × ${seats}`
            : `السعر = ${Number(price) || 0} × ${seats} × ${tripsCount}`}
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-sky-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-700 disabled:opacity-60"
      >
        {loading ? "جاري الحجز..." : "تأكيد الحجز"}
      </button>

      <div className="min-h-[56px] rounded-2xl bg-slate-50 px-4 py-3 text-center text-sm text-slate-700 ring-1 ring-slate-100">
        {message || "—"}
      </div>
    </form>
  );
}