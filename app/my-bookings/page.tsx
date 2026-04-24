"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lip/supabase-client";
import Toast from "../components/Toast";

type Subscription = {
  id: number;
  plan_type: "weekly" | "monthly";
  total_credits: number;
  remaining_credits: number;
  starts_at: string;
  expires_at: string;
  status: string;
  trip_id: number;
};

type Booking = {
  id: number;
  user_id: string;
  trip_id: number;
  schedule_id: number | null;
  pickup_stop_id: number | null;
  dropoff_stop_id: number | null;
  booking_date: string | null;
  booking_type: string | null;
  payment_method: string | null;
  status: string;
  seats: number;
  booked_using_subscription: boolean;
  confirmed_driver_id: number | null;
  confirmed_vehicle_id: number | null;
};

type Trip = {
  id: number;
  from_location: string;
  to_location: string;
};

type Stop = {
  id: number;
  stop_name: string;
  lat: number | null;
  lng: number | null;
};

type Schedule = {
  id: number;
  time_text: string;
};

type Driver = {
  id: number;
  full_name: string;
  phone: string | null;
};

type Vehicle = {
  id: number;
  name: string;
  plate_number: string | null;
};

type BookingFilter = "upcoming" | "completed" | "cancelled" | "all";

function parseTimeText(timeText: string | null | undefined) {
  if (!timeText) return null;

  const value = timeText.trim();

  let match = value.match(/(\d{1,2})[:.](\d{2})\s*(AM|PM|am|pm)/);
  if (match) {
    let hour = Number(match[1]);
    const minute = Number(match[2]);
    const suffix = match[3].toLowerCase();

    if (suffix === "pm" && hour < 12) hour += 12;
    if (suffix === "am" && hour === 12) hour = 0;

    return { hour, minute };
  }

  match = value.match(/(AM|PM|am|pm)\s*(\d{1,2})[:.](\d{2})/);
  if (match) {
    const suffix = match[1].toLowerCase();
    let hour = Number(match[2]);
    const minute = Number(match[3]);

    if (suffix === "pm" && hour < 12) hour += 12;
    if (suffix === "am" && hour === 12) hour = 0;

    return { hour, minute };
  }

  match = value.match(/(\d{1,2})[:.](\d{2})/);
  if (match) {
    return {
      hour: Number(match[1]),
      minute: Number(match[2]),
    };
  }

  return null;
}

function getTripDateTime(
  bookingDate: string | null,
  timeText: string | null | undefined
) {
  if (!bookingDate || !timeText) return null;

  const parsed = parseTimeText(timeText);
  if (!parsed) return null;

  const date = new Date(`${bookingDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;

  date.setHours(parsed.hour, parsed.minute, 0, 0);
  return date;
}

function getGoogleMapsLink(lat?: number | null, lng?: number | null) {
  if (lat == null || lng == null) return null;
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

function statusLabel(status: string) {
  if (status === "pending") return "قيد المراجعة";
  if (status === "confirmed") return "مؤكد";
  if (status === "completed") return "مكتمل";
  if (status === "cancelled") return "ملغي";
  return status;
}

function statusClass(status: string) {
  if (status === "confirmed") return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (status === "completed") return "bg-sky-50 text-sky-700 ring-sky-100";
  if (status === "cancelled") return "bg-red-50 text-red-700 ring-red-100";
  return "bg-amber-50 text-amber-700 ring-amber-100";
}

export default function MyBookingsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tripsMap, setTripsMap] = useState<Record<number, Trip>>({});
  const [stopsMap, setStopsMap] = useState<Record<number, Stop>>({});
  const [schedulesMap, setSchedulesMap] = useState<Record<number, Schedule>>({});
  const [driversMap, setDriversMap] = useState<Record<number, Driver>>({});
  const [vehiclesMap, setVehiclesMap] = useState<Record<number, Vehicle>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingCancelId, setLoadingCancelId] = useState<number | null>(null);
  const [filter, setFilter] = useState<BookingFilter>("upcoming");

  async function loadData() {
    setMessage("");
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      window.location.href = "/login";
      return;
    }

    await supabase.rpc("expire_old_subscriptions");

    const { data: subs, error: subsError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (subsError) {
      setMessage(`حصل خطأ أثناء تحميل الاشتراكات: ${subsError.message}`);
    }

    const { data: bookingRows, error: bookingsError } = await supabase
      .from("bookings")
      .select(`
        id,
        user_id,
        trip_id,
        schedule_id,
        pickup_stop_id,
        dropoff_stop_id,
        booking_date,
        booking_type,
        payment_method,
        status,
        seats,
        booked_using_subscription,
        confirmed_driver_id,
        confirmed_vehicle_id
      `)
      .eq("user_id", session.user.id)
      .order("id", { ascending: false });

    if (bookingsError) {
      setMessage((prev) =>
        `${prev ? `${prev}\n` : ""}حصل خطأ أثناء تحميل الحجوزات: ${bookingsError.message}`
      );
    }

    const safeBookings = (bookingRows as Booking[] | null) ?? [];
    const safeSubs = (subs as Subscription[] | null) ?? [];

    setBookings(safeBookings);
    setSubscriptions(safeSubs);

    const tripIds = [
      ...new Set([
        ...safeBookings.map((b) => b.trip_id).filter(Boolean),
        ...safeSubs.map((s) => s.trip_id).filter(Boolean),
      ]),
    ];

    const stopIds = [
      ...new Set([
        ...safeBookings.map((b) => b.pickup_stop_id).filter(Boolean),
        ...safeBookings.map((b) => b.dropoff_stop_id).filter(Boolean),
      ]),
    ] as number[];

    const scheduleIds = [
      ...new Set(safeBookings.map((b) => b.schedule_id).filter(Boolean)),
    ] as number[];

    const driverIds = [
      ...new Set(safeBookings.map((b) => b.confirmed_driver_id).filter(Boolean)),
    ] as number[];

    const vehicleIds = [
      ...new Set(safeBookings.map((b) => b.confirmed_vehicle_id).filter(Boolean)),
    ] as number[];

    if (tripIds.length) {
      const { data } = await supabase
        .from("trips")
        .select("id, from_location, to_location")
        .in("id", tripIds);

      const map: Record<number, Trip> = {};
      ((data as Trip[] | null) ?? []).forEach((item) => {
        map[item.id] = item;
      });
      setTripsMap(map);
    } else {
      setTripsMap({});
    }

    if (stopIds.length) {
      const { data } = await supabase
        .from("trip_stops")
        .select("id, stop_name, lat, lng")
        .in("id", stopIds);

      const map: Record<number, Stop> = {};
      ((data as Stop[] | null) ?? []).forEach((item) => {
        map[item.id] = item;
      });
      setStopsMap(map);
    } else {
      setStopsMap({});
    }

    if (scheduleIds.length) {
      const { data } = await supabase
        .from("trip_schedules")
        .select("id, time_text")
        .in("id", scheduleIds);

      const map: Record<number, Schedule> = {};
      ((data as Schedule[] | null) ?? []).forEach((item) => {
        map[item.id] = item;
      });
      setSchedulesMap(map);
    } else {
      setSchedulesMap({});
    }

    if (driverIds.length) {
      const { data } = await supabase
        .from("drivers")
        .select("id, full_name, phone")
        .in("id", driverIds);

      const map: Record<number, Driver> = {};
      ((data as Driver[] | null) ?? []).forEach((item) => {
        map[item.id] = item;
      });
      setDriversMap(map);
    } else {
      setDriversMap({});
    }

    if (vehicleIds.length) {
      const { data } = await supabase
        .from("vehicles")
        .select("id, name, plate_number")
        .in("id", vehicleIds);

      const map: Record<number, Vehicle> = {};
      ((data as Vehicle[] | null) ?? []).forEach((item) => {
        map[item.id] = item;
      });
      setVehiclesMap(map);
    } else {
      setVehiclesMap({});
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function cancelBooking(booking: Booking) {
    const confirmed = window.confirm("هل أنت متأكد من إلغاء هذا الحجز؟");
    if (!confirmed) return;

    setMessage("");
    setLoadingCancelId(booking.id);

    try {
      const schedule = booking.schedule_id ? schedulesMap[booking.schedule_id] : null;
      const tripDateTime = getTripDateTime(booking.booking_date, schedule?.time_text);

      if (!tripDateTime) {
        throw new Error(
          `تعذر تحديد موعد الرحلة لإلغاء الحجز. الموعد الحالي: ${schedule?.time_text || "غير موجود"}`
        );
      }

      const diffMs = tripDateTime.getTime() - Date.now();

      if (diffMs < 60 * 60 * 1000) {
        throw new Error("لا يمكن إلغاء الحجز قبل الرحلة بأقل من ساعة");
      }

      const { data, error } = await supabase.rpc("cancel_booking_by_id", {
        p_booking_id: booking.id,
        p_user_id: booking.user_id,
        p_is_admin: false,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.success) {
        throw new Error(data?.message || "تعذر إلغاء الحجز");
      }

      setMessage("تم إلغاء الحجز بنجاح");
      await loadData();
    } catch (err: any) {
      setMessage(err.message || "حدث خطأ أثناء إلغاء الحجز");
    }

    setLoadingCancelId(null);
  }

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const schedule = booking.schedule_id ? schedulesMap[booking.schedule_id] : null;
      const tripDateTime = getTripDateTime(booking.booking_date, schedule?.time_text);
      const isUpcoming =
        booking.status !== "cancelled" &&
        booking.status !== "completed" &&
        (!tripDateTime || tripDateTime.getTime() >= Date.now());

      if (filter === "all") return true;
      if (filter === "cancelled") return booking.status === "cancelled";
      if (filter === "completed") return booking.status === "completed";
      if (filter === "upcoming") return isUpcoming;

      return true;
    });
  }, [bookings, schedulesMap, filter]);

  const activeSubscriptions = subscriptions.filter((s) => s.status === "active");
  const oldSubscriptions = subscriptions.filter((s) => s.status !== "active");

  return (
    <main className="min-h-screen bg-[#eef8ff] px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-[32px] bg-white/80 p-8 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">رحلاتي واشتراكاتي</h1>
              <p className="mt-2 text-sm text-slate-500">
                تابع حجوزاتك، نقاط الركوب، الاشتراكات، وبيانات الرحلة.
              </p>
            </div>

            <button
              type="button"
              onClick={loadData}
              className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              Sync / Refresh
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`rounded-2xl px-4 py-3 text-center text-sm shadow-xl shadow-sky-900/5 ring-1 ${
              message.includes("نجاح") || message.includes("تم")
                ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                : "bg-red-50 text-red-700 ring-red-100"
            }`}
          >
            {message}
          </div>
        )}

        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            <section className="rounded-[32px] bg-white/80 p-6 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
              <h2 className="mb-4 text-2xl font-bold">الاشتراكات النشطة</h2>

              {activeSubscriptions.length === 0 ? (
                <EmptyState text="لا توجد اشتراكات نشطة حالياً" />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {activeSubscriptions.map((sub) => {
                    const trip = tripsMap[sub.trip_id];
                    const used = sub.total_credits - sub.remaining_credits;
                    const progress =
                      sub.total_credits > 0
                        ? Math.round((used / sub.total_credits) * 100)
                        : 0;

                    return (
                      <div
                        key={sub.id}
                        className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-100"
                      >
                        <div className="mb-2 text-lg font-bold">
                          {trip ? `${trip.from_location} ← ${trip.to_location}` : "—"}
                        </div>

                        <div className="text-sm text-slate-600">
                          النوع: {sub.plan_type === "weekly" ? "اشتراك أسبوعي" : "اشتراك شهري"}
                        </div>

                        <div className="mt-3">
                          <div className="mb-2 flex justify-between text-xs text-slate-500">
                            <span>المستخدم: {used}</span>
                            <span>المتبقي: {sub.remaining_credits}</span>
                          </div>

                          <div className="h-3 overflow-hidden rounded-full bg-white ring-1 ring-slate-100">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>

                          <p className="mt-2 text-xs text-slate-500">
                            {sub.remaining_credits} / {sub.total_credits} رحلة متبقية
                          </p>
                        </div>

                        <div className="mt-3 text-sm text-slate-600">
                          الانتهاء: {sub.expires_at}
                        </div>

                        <div className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                          {sub.status}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="rounded-[32px] bg-white/80 p-6 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
              <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <h2 className="text-2xl font-bold">الحجوزات</h2>

                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "upcoming", label: "Upcoming" },
                    { key: "completed", label: "Completed" },
                    { key: "cancelled", label: "Cancelled" },
                    { key: "all", label: "All" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setFilter(item.key as BookingFilter)}
                      className={`rounded-2xl px-4 py-2 text-xs font-semibold transition ${
                        filter === item.key
                          ? "bg-sky-600 text-white"
                          : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredBookings.length === 0 ? (
                <EmptyState text="لا توجد رحلات حالياً" />
              ) : (
                <div className="grid gap-4">
                  {filteredBookings.map((booking) => {
                    const trip = tripsMap[booking.trip_id];
                    const pickupStop = booking.pickup_stop_id
                      ? stopsMap[booking.pickup_stop_id]
                      : null;
                    const dropoffStop = booking.dropoff_stop_id
                      ? stopsMap[booking.dropoff_stop_id]
                      : null;
                    const schedule = booking.schedule_id
                      ? schedulesMap[booking.schedule_id]
                      : null;
                    const driver = booking.confirmed_driver_id
                      ? driversMap[booking.confirmed_driver_id]
                      : null;
                    const vehicle = booking.confirmed_vehicle_id
                      ? vehiclesMap[booking.confirmed_vehicle_id]
                      : null;

                    const tripDateTime = getTripDateTime(
                      booking.booking_date,
                      schedule?.time_text
                    );

                    const canCancel =
                      booking.status !== "cancelled" &&
                      booking.status !== "completed" &&
                      tripDateTime !== null &&
                      tripDateTime.getTime() - Date.now() >= 60 * 60 * 1000;

                    const pickupMapLink = getGoogleMapsLink(pickupStop?.lat, pickupStop?.lng);
                    const dropoffMapLink = getGoogleMapsLink(dropoffStop?.lat, dropoffStop?.lng);

                    return (
                      <div
                        key={booking.id}
                        className="rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-100"
                      >
                        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="text-xl font-bold">
                              {trip ? `${trip.from_location} ← ${trip.to_location}` : "—"}
                            </div>

                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                              <span className="rounded-full bg-sky-50 px-3 py-1 font-semibold text-sky-700 ring-1 ring-sky-100">
                                {booking.booking_type || "—"}
                              </span>

                              <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700 ring-1 ring-emerald-100">
                                {booking.payment_method || "—"}
                              </span>

                              <span
                                className={`rounded-full px-3 py-1 font-semibold ring-1 ${statusClass(
                                  booking.status
                                )}`}
                              >
                                {statusLabel(booking.status)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                          <InfoCard title="تاريخ الحجز" value={booking.booking_date || "—"} />
                          <InfoCard title="موعد الرحلة" value={schedule?.time_text || "—"} />
                          <InfoCard title="عدد الكراسي" value={String(booking.seats)} />

                          <LocationCard
                            title="نقطة الالتقاء"
                            name={pickupStop?.stop_name || "—"}
                            link={pickupMapLink}
                          />

                          <LocationCard
                            title="نقطة النزول"
                            name={dropoffStop?.stop_name || "—"}
                            link={dropoffMapLink}
                          />

                          <InfoCard
                            title="نوع الاستخدام"
                            value={
                              booking.booked_using_subscription
                                ? "تم الحجز باستخدام اشتراك"
                                : "حجز عادي"
                            }
                          />
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
                            <p className="mb-2 text-sm font-bold">بيانات السائق</p>
                            <p className="text-sm text-slate-600">
                              الاسم: {driver?.full_name || "لم يتم التعيين بعد"}
                            </p>
                            <p className="text-sm text-slate-600">
                              الهاتف: {driver?.phone || "—"}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
                            <p className="mb-2 text-sm font-bold">بيانات العربية</p>
                            <p className="text-sm text-slate-600">
                              الاسم: {vehicle?.name || "لم يتم التعيين بعد"}
                            </p>
                            <p className="text-sm text-slate-600">
                              اللوحة: {vehicle?.plate_number || "—"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => cancelBooking(booking)}
                            disabled={!canCancel || loadingCancelId === booking.id}
                            className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                              canCancel && loadingCancelId !== booking.id
                                ? "bg-red-600 text-white hover:bg-red-700"
                                : "bg-slate-200 text-slate-500"
                            }`}
                          >
                            {loadingCancelId === booking.id
                              ? "جاري الإلغاء..."
                              : "إلغاء الحجز"}
                          </button>

                          {!canCancel && booking.status !== "cancelled" && booking.status !== "completed" && (
                            <div className="self-center text-xs text-slate-500">
                              لا يمكن الإلغاء قبل الرحلة بأقل من ساعة
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {oldSubscriptions.length > 0 && (
              <section className="rounded-[32px] bg-white/80 p-6 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
                <h2 className="mb-4 text-2xl font-bold">الاشتراكات السابقة</h2>

                <div className="grid gap-4 md:grid-cols-2">
                  {oldSubscriptions.map((sub) => {
                    const trip = tripsMap[sub.trip_id];

                    return (
                      <div
                        key={sub.id}
                        className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-100"
                      >
                        <div className="mb-2 text-lg font-bold">
                          {trip ? `${trip.from_location} ← ${trip.to_location}` : "—"}
                        </div>
                        <div className="text-sm text-slate-600">
                          النوع: {sub.plan_type === "weekly" ? "اشتراك أسبوعي" : "اشتراك شهري"}
                        </div>
                        <div className="text-sm text-slate-600">
                          الرصيد: {sub.remaining_credits} / {sub.total_credits}
                        </div>
                        <div className="text-sm text-slate-600">
                          الانتهاء: {sub.expires_at}
                        </div>
                        <div className="mt-2 text-sm font-semibold text-slate-700">
                          الحالة: {sub.status}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
      <p className="text-xs text-slate-500">{title}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function LocationCard({
  title,
  name,
  link,
}: {
  title: string;
  name: string;
  link: string | null;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
      <p className="text-xs text-slate-500">{title}</p>
      <p className="mt-1 font-semibold">{name}</p>

      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-xs font-bold text-sky-600"
        >
          فتح على Google Maps
        </a>
      ) : (
        <p className="mt-2 text-xs text-slate-400">لا يوجد موقع متاح</p>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-3xl bg-slate-50 px-6 py-10 text-center text-sm text-slate-500 ring-1 ring-slate-100">
      {text}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="h-40 animate-pulse rounded-[32px] bg-white/70 ring-1 ring-white/70"
        />
      ))}
    </div>
  );
}