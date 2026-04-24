"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lip/supabase-client";
import Toast from "@/app/components/Toast";

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

type Subscription = {
  id: number;
  plan_type: "weekly" | "monthly";
  total_credits: number;
  remaining_credits: number;
  starts_at: string;
  expires_at: string;
  status: "active" | "expired" | "cancelled";
};

type BookingType = "one_way" | "round_trip" | "weekly" | "monthly";
type PaymentMethod = "cash" | "instapay";

const dayMap = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const dayLabels = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

const paymentLabels: Record<string, string> = {
  cash: "كاش",
  instapay: "انستا باي",
};

const bookingTypeDetails: Record<BookingType, { title: string; desc: string }> = {
  one_way: {
    title: "ذهاب فقط",
    desc: "حجز رحلة واحدة في الموعد والتاريخ المختار.",
  },
  round_trip: {
    title: "ذهاب وعودة",
    desc: "حجز رحلة الذهاب ورحلة العودة معًا.",
  },
  weekly: {
    title: "اشتراك أسبوعي",
    desc: "شراء رصيد 5 رحلات صالح لمدة أسبوع.",
  },
  monthly: {
    title: "اشتراك شهري",
    desc: "شراء رصيد 22 رحلة صالح لمدة شهر.",
  },
};

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function sameMonth(date: Date, monthDate: Date) {
  return (
    date.getFullYear() === monthDate.getFullYear() &&
    date.getMonth() === monthDate.getMonth()
  );
}

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
  reverseTripId,
  supportsRoundTrip,
  availableDays,
  tripPaymentMethods,
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
  reverseTripId?: number | null;
  supportsRoundTrip?: boolean;
  availableDays: string[];
  tripPaymentMethods: string[];
}) {
  const [bookingDate, setBookingDate] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [scheduleId, setScheduleId] = useState("");
  const [returnScheduleId, setReturnScheduleId] = useState("");
  const [pickupStopId, setPickupStopId] = useState("");
  const [dropoffStopId, setDropoffStopId] = useState("");
  const [seats, setSeats] = useState(1);
  const [bookingType, setBookingType] = useState<BookingType>("one_way");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    (tripPaymentMethods?.[0] as PaymentMethod) || "cash"
  );
  const [useSubscription, setUseSubscription] = useState(false);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState("");

  const [user, setUser] = useState<UserProfile | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const canShowRoundTrip = Boolean(supportsRoundTrip || reverseTripId);
  const canBookRoundTrip = Boolean(reverseTripId);
  const todayString = formatDate(new Date());

  const isBuyingSubscription =
    bookingType === "weekly" || bookingType === "monthly";

  useEffect(() => {
    async function loadUserAndSubscriptions() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, phone")
        .eq("id", session.user.id)
        .single();

      setUser(profile);

      await supabase.rpc("expire_old_subscriptions");

      const today = new Date().toISOString().slice(0, 10);

      const { data: subs } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("trip_id", tripId)
        .eq("status", "active")
        .gt("remaining_credits", 0)
        .gte("expires_at", today)
        .order("created_at", { ascending: false });

      setSubscriptions((subs as Subscription[] | null) ?? []);
    }

    loadUserAndSubscriptions();
  }, [tripId]);

  useEffect(() => {
    if (!tripPaymentMethods.includes(paymentMethod)) {
      setPaymentMethod((tripPaymentMethods?.[0] as PaymentMethod) || "cash");
    }
  }, [tripPaymentMethods, paymentMethod]);

  useEffect(() => {
    if (isBuyingSubscription) {
      setUseSubscription(false);
      setSelectedSubscriptionId("");
      setReturnScheduleId("");
    }
  }, [isBuyingSubscription]);

  const tripCount = useMemo(() => {
    if (bookingType === "weekly") return 5;
    if (bookingType === "monthly") return 22;
    if (bookingType === "round_trip") return 2;
    return 1;
  }, [bookingType]);

  const unitPrice = useMemo(() => {
    const safePrice = Number(price) || 0;
    if (bookingType === "weekly") return weeklyPrice ?? safePrice * 5;
    if (bookingType === "monthly") return monthlyPrice ?? safePrice * 22;
    return safePrice;
  }, [price, bookingType, weeklyPrice, monthlyPrice]);

  const total = useMemo(() => {
    const safePrice = Number(price) || 0;

    if (bookingType === "weekly") return (weeklyPrice ?? safePrice * 5) * seats;
    if (bookingType === "monthly") return (monthlyPrice ?? safePrice * 22) * seats;
    if (bookingType === "round_trip") return safePrice * 2 * seats;

    return safePrice * seats;
  }, [price, bookingType, weeklyPrice, monthlyPrice, seats]);

  const priceBreakdown = useMemo(() => {
    const safePrice = Number(price) || 0;

    if (bookingType === "weekly") {
      return `السعر = ${weeklyPrice ?? safePrice * 5} × ${seats} ${
        seats === 1 ? "كرسي" : "كراسي"
      }`;
    }

    if (bookingType === "monthly") {
      return `السعر = ${monthlyPrice ?? safePrice * 22} × ${seats} ${
        seats === 1 ? "كرسي" : "كراسي"
      }`;
    }

    if (bookingType === "round_trip") {
      return `السعر = ${safePrice} × ${seats} ${
        seats === 1 ? "كرسي" : "كراسي"
      } × 2 رحلة`;
    }

    return `السعر = ${safePrice} × ${seats} ${
      seats === 1 ? "كرسي" : "كراسي"
    }`;
  }, [price, bookingType, weeklyPrice, monthlyPrice, seats]);

  const bookingOptions: { key: BookingType; label: string; desc: string }[] = [
    {
      key: "one_way",
      label: bookingTypeDetails.one_way.title,
      desc: bookingTypeDetails.one_way.desc,
    },
    ...(canShowRoundTrip
      ? [
          {
            key: "round_trip" as BookingType,
            label: bookingTypeDetails.round_trip.title,
            desc: bookingTypeDetails.round_trip.desc,
          },
        ]
      : []),
    ...(allowWeeklySubscription
      ? [
          {
            key: "weekly" as BookingType,
            label: bookingTypeDetails.weekly.title,
            desc: bookingTypeDetails.weekly.desc,
          },
        ]
      : []),
    ...(allowMonthlySubscription
      ? [
          {
            key: "monthly" as BookingType,
            label: bookingTypeDetails.monthly.title,
            desc: bookingTypeDetails.monthly.desc,
          },
        ]
      : []),
  ];

  const calendarDays = useMemo(() => {
    const firstDay = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      1
    );
    const start = new Date(firstDay);
    start.setDate(firstDay.getDate() - firstDay.getDay());

    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const dayName = dayMap[date.getDay()];
      const dateString = formatDate(date);
      const isAvailable = availableDays.includes(dayName);
      const isCurrentMonth = sameMonth(date, calendarMonth);
      const isPast = dateString < todayString;

      return {
        date,
        dayName,
        isAvailable,
        isCurrentMonth,
        isPast,
        dateString,
      };
    });
  }, [calendarMonth, availableDays, todayString]);

  async function createSubscription(plan: "weekly" | "monthly") {
    if (!user) throw new Error("لازم تسجل دخول الأول");

    const startDate = bookingDate || todayString;
    const start = new Date(startDate);

    const startDayName = dayMap[start.getDay()];
    if (!availableDays.includes(startDayName)) {
      throw new Error("اليوم المختار غير متاح لهذه الرحلة");
    }

    if (startDate < todayString) {
      throw new Error("لا يمكن اختيار تاريخ قديم");
    }

    const expires = new Date(start);
    if (plan === "weekly") {
      expires.setDate(expires.getDate() + 6);
    } else {
      expires.setDate(expires.getDate() + 29);
    }

    const totalCredits = plan === "weekly" ? 5 : 22;

    const { error } = await supabase.from("subscriptions").insert({
      user_id: user.id,
      trip_id: tripId,
      plan_type: plan,
      total_credits: totalCredits,
      remaining_credits: totalCredits,
      starts_at: start.toISOString().slice(0, 10),
      expires_at: expires.toISOString().slice(0, 10),
      status: "active",
    });

    if (error) throw new Error(error.message);
  }

  async function handleRegularBooking() {
    if (!user) throw new Error("لازم تسجل دخول الأول");
    if (!bookingDate) throw new Error("اختر تاريخ الحجز");
    if (!scheduleId) throw new Error("اختر معاد الذهاب");
    if (!pickupStopId) throw new Error("اختر مكان الركوب");
    if (!dropoffStopId) throw new Error("اختر مكان النزول");

    if (bookingType === "round_trip" && !returnScheduleId) {
      throw new Error("اختر موعد العودة");
    }

    if (bookingType === "round_trip" && !canBookRoundTrip) {
      throw new Error("رحلة العودة غير مربوطة");
    }

    const outboundPayload = {
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
      subscription_id: null,
      booked_using_subscription: false,
    };

    const { error: outboundError } = await supabase
      .from("bookings")
      .insert(outboundPayload);

    if (outboundError) throw new Error(outboundError.message);

    if (bookingType === "round_trip" && reverseTripId) {
      const returnPayload = {
        user_id: user.id,
        trip_id: reverseTripId,
        booking_date: bookingDate,
        schedule_id: Number(returnScheduleId),
        return_schedule_id: null,
        pickup_stop_id: Number(dropoffStopId),
        dropoff_stop_id: Number(pickupStopId),
        seats,
        status: "pending",
        payment_method: paymentMethod,
        booking_type: "one_way",
        subscription_id: null,
        booked_using_subscription: false,
      };

      const { error: returnError } = await supabase
        .from("bookings")
        .insert(returnPayload);

      if (returnError) throw new Error(returnError.message);
    }
  }

  async function handleSubscriptionBooking() {
    if (!user) throw new Error("لازم تسجل دخول الأول");
    if (!selectedSubscriptionId) {
      throw new Error("اختر الاشتراك الذي تريد استخدامه");
    }
    if (!bookingDate) throw new Error("اختر تاريخ الحجز");
    if (!scheduleId) throw new Error("اختر معاد الذهاب");
    if (!pickupStopId) throw new Error("اختر مكان الركوب");
    if (!dropoffStopId) throw new Error("اختر مكان النزول");
    if (bookingType === "round_trip" && !returnScheduleId) {
      throw new Error("اختر موعد العودة");
    }

    const { error } = await supabase.rpc("book_with_subscription", {
      p_subscription_id: Number(selectedSubscriptionId),
      p_user_id: user.id,
      p_trip_id: tripId,
      p_booking_date: bookingDate,
      p_schedule_id: Number(scheduleId),
      p_pickup_stop_id: Number(pickupStopId),
      p_dropoff_stop_id: Number(dropoffStopId),
      p_seats: seats,
      p_return_schedule_id: returnScheduleId ? Number(returnScheduleId) : null,
      p_payment_method: paymentMethod,
      p_booking_type: bookingType,
      p_reverse_trip_id: reverseTripId ?? null,
      p_create_return: bookingType === "round_trip",
    });

    if (error) throw new Error(error.message);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      if (!bookingDate) {
        throw new Error("اختر تاريخ الحجز");
      }

      if (bookingDate < todayString) {
        throw new Error("لا يمكن الحجز على تاريخ قديم");
      }

      const chosenDate = new Date(bookingDate);
      const chosenDayName = dayMap[chosenDate.getDay()];
      if (!availableDays.includes(chosenDayName)) {
        throw new Error("اليوم المختار غير متاح لهذه الرحلة");
      }

      if (bookingType === "weekly" || bookingType === "monthly") {
        await createSubscription(bookingType);
        setMessage("تم شراء الاشتراك بنجاح، وتقدر تبدأ تحجز من رصيدك الآن");

        setTimeout(() => {
          window.location.href = "/my-bookings";
        }, 900);

        return;
      }

      if (useSubscription) {
        await handleSubscriptionBooking();
      } else {
        await handleRegularBooking();
      }

      setMessage("تم تأكيد الحجز بنجاح");

      setTimeout(() => {
        window.location.href = "/my-bookings";
      }, 700);
    } catch (err: any) {
      setMessage(err.message || "حصل خطأ أثناء التنفيذ");
    }

    setLoading(false);
  }

  const submitLabel = loading
    ? "جاري التنفيذ..."
    : isBuyingSubscription
    ? "شراء الاشتراك"
    : "تأكيد الحجز";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-[32px] bg-white/80 p-8 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur"
    >
      <div>
        <h2 className="text-3xl font-bold">اختيار تفاصيل الرحلة</h2>
        <p className="mt-2 text-sm text-slate-500">
          اختار التاريخ، نوع الحجز، نقطة الركوب والنزول، وبعدها أكد الحجز.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() =>
              setCalendarMonth(
                new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)
              )
            }
            className="rounded-xl bg-slate-100 px-3 py-2 text-sm transition hover:bg-slate-200"
          >
            السابق
          </button>

          <div className="font-bold">
            {calendarMonth.toLocaleDateString("ar-EG", {
              month: "long",
              year: "numeric",
            })}
          </div>

          <button
            type="button"
            onClick={() =>
              setCalendarMonth(
                new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)
              )
            }
            className="rounded-xl bg-slate-100 px-3 py-2 text-sm transition hover:bg-slate-200"
          >
            التالي
          </button>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-2">
          {dayLabels.map((label) => (
            <div key={label} className="text-center text-xs font-bold text-slate-500">
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((item) => {
            const isSelected = bookingDate === item.dateString;
            const isDisabled =
              !item.isAvailable || !item.isCurrentMonth || item.isPast;

            return (
              <button
                key={item.dateString}
                type="button"
                onClick={() => !isDisabled && setBookingDate(item.dateString)}
                disabled={isDisabled}
                className={`rounded-xl px-2 py-3 text-sm font-semibold transition ${
                  !item.isCurrentMonth
                    ? "bg-slate-50 text-slate-300"
                    : item.isPast
                    ? "bg-slate-100 text-slate-400 ring-1 ring-slate-200"
                    : item.isAvailable
                    ? isSelected
                      ? "bg-sky-600 text-white"
                      : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 hover:bg-emerald-100"
                    : "bg-red-50 text-red-500 ring-1 ring-red-100"
                }`}
              >
                {item.date.getDate()}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
            <span>متاح</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-400" />
            <span>غير متاح</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-slate-400" />
            <span>تاريخ فات</span>
          </div>
        </div>

        {bookingDate && (
          <div className="mt-4 rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-700 ring-1 ring-sky-100">
            التاريخ المختار: {bookingDate}
          </div>
        )}
      </div>

      <div>
        <p className="mb-3 font-semibold">نوع الحجز</p>

        <div className="grid gap-3 md:grid-cols-2">
          {bookingOptions.map((item) => {
            const active = bookingType === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setBookingType(item.key)}
                className={`rounded-3xl p-4 text-right transition ${
                  active
                    ? "bg-sky-600 text-white shadow-lg shadow-sky-500/20"
                    : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">{item.label}</p>
                    <p
                      className={`mt-1 text-xs leading-6 ${
                        active ? "text-sky-50" : "text-slate-500"
                      }`}
                    >
                      {item.desc}
                    </p>
                  </div>

                  <span
                    className={`mt-1 h-5 w-5 rounded-full border ${
                      active
                        ? "border-white bg-white"
                        : "border-slate-300 bg-white"
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {subscriptions.length > 0 && (
        <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
          <p className="mb-3 font-bold text-emerald-700">اشتراكاتك النشطة</p>

          <div className="space-y-2">
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="rounded-xl bg-white px-4 py-3 text-sm ring-1 ring-emerald-100"
              >
                <div>
                  النوع: {sub.plan_type === "weekly" ? "أسبوعي" : "شهري"}
                </div>
                <div>
                  الرصيد المتبقي: {sub.remaining_credits} / {sub.total_credits}
                </div>
                <div>ينتهي في: {sub.expires_at}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(bookingType === "one_way" || bookingType === "round_trip") &&
        subscriptions.length > 0 && (
          <div className="space-y-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={useSubscription}
                onChange={(e) => setUseSubscription(e.target.checked)}
              />
              استخدم اشتراك في هذا الحجز
            </label>

            <p className="text-xs leading-6 text-slate-500">
              سيتم خصم {bookingType === "round_trip" ? "رحلتين" : "رحلة واحدة"} من
              رصيد الاشتراك المختار.
            </p>

            {useSubscription && (
              <select
                value={selectedSubscriptionId}
                onChange={(e) => setSelectedSubscriptionId(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-black outline-none"
              >
                <option value="">اختر الاشتراك</option>
                {subscriptions.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.plan_type === "weekly" ? "أسبوعي" : "شهري"} - رصيد{" "}
                    {sub.remaining_credits} - ينتهي {sub.expires_at}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

      {isBuyingSubscription && (
        <div className="rounded-2xl bg-amber-50 p-4 text-sm leading-7 text-amber-800 ring-1 ring-amber-100">
          أنت الآن تشتري اشتراك جديد. بعد الشراء سيظهر لك رصيد الرحلات في حسابك،
          وبعدها يمكنك الحجز باستخدام الاشتراك.
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">معاد الذهاب</label>
          <select
            value={scheduleId}
            onChange={(e) => setScheduleId(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-black outline-none"
            disabled={isBuyingSubscription}
          >
            <option value="">اختر معاد الذهاب</option>
            {schedules.map((s) => (
              <option key={s.id} value={s.id}>
                {s.time_text}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">موعد العودة</label>
          <select
            value={returnScheduleId}
            onChange={(e) => setReturnScheduleId(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-black outline-none disabled:bg-slate-100 disabled:text-slate-400"
            disabled={bookingType !== "round_trip" || isBuyingSubscription}
          >
            <option value="">اختر موعد العودة</option>
            {schedules.map((s) => (
              <option key={s.id} value={s.id}>
                {s.time_text}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">مكان الركوب</label>
          <select
            value={pickupStopId}
            onChange={(e) => setPickupStopId(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-black outline-none"
            disabled={isBuyingSubscription}
          >
            <option value="">اختر مكان الركوب</option>
            {pickupStops.map((stop) => (
              <option key={stop.id} value={stop.id}>
                {stop.stop_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">مكان النزول</label>
          <select
            value={dropoffStopId}
            onChange={(e) => setDropoffStopId(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-black outline-none"
            disabled={isBuyingSubscription}
          >
            <option value="">اختر مكان النزول</option>
            {dropoffStops.map((stop) => (
              <option key={stop.id} value={stop.id}>
                {stop.stop_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">عدد الكراسي</label>
        <select
          value={seats}
          onChange={(e) => setSeats(Number(e.target.value))}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-black outline-none"
        >
          {[1, 2, 3, 4, 5].map((seatCount) => (
            <option key={seatCount} value={seatCount}>
              {seatCount} {seatCount === 1 ? "كرسي" : "كراسي"}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="mb-3 font-semibold">طريقة الدفع</p>

        <div className="flex gap-3">
          {tripPaymentMethods.map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setPaymentMethod(method as PaymentMethod)}
              className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                paymentMethod === method
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                  : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {paymentLabels[method] || method}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl bg-sky-50 p-5 ring-1 ring-sky-100">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-500">
              {isBuyingSubscription ? "تكلفة الاشتراك" : "إجمالي التكلفة"}
            </p>
            <p className="mt-1 text-3xl font-bold text-sky-700">{total} EGP</p>
            <p className="mt-1 text-xs text-slate-500">{priceBreakdown}</p>
          </div>

          <div className="rounded-2xl bg-white px-4 py-3 text-sm ring-1 ring-sky-100">
            <p className="text-slate-500">
              {isBuyingSubscription ? "رصيد الاشتراك" : "عدد الرحلات"}
            </p>
            <p className="mt-1 font-bold text-slate-900">
              {isBuyingSubscription
                ? `${tripCount} رحلة`
                : bookingType === "round_trip"
                ? "رحلتين"
                : "رحلة واحدة"}
            </p>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-sky-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:-translate-y-0.5 hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {submitLabel}
      </button>

      <div className="min-h-[56px] rounded-2xl bg-slate-50 px-4 py-3 text-center text-sm text-slate-700 ring-1 ring-slate-100">
        {message || "—"}
      </div>
    </form>
  );
}