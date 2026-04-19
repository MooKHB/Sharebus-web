"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lip/supabase-client";

type BookingRow = {
  id: number;
  status: string;
  seats: number;
  created_at: string;
  booking_date: string | null;
  payment_method: string | null;
  booking_type: string | null;
  trips: {
    from_location: string;
    to_location: string;
    price: number;
    duration_text: string;
    weekly_price: number | null;
    monthly_price: number | null;
  } | null;
  trip_schedules: {
    time_text: string;
  } | null;
  return_trip_schedule: {
    time_text: string;
  } | null;
  pickup_stop: {
    stop_name: string;
  } | null;
  dropoff_stop: {
    stop_name: string;
  } | null;
};

type FilterType = "current" | "completed" | "cancelled";

export default function MyBookingsPage() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [filter, setFilter] = useState<FilterType>("current");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user;
    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id,
        status,
        seats,
        created_at,
        booking_date,
        payment_method,
        booking_type,
        trips:trip_id (
          from_location,
          to_location,
          price,
          duration_text,
          weekly_price,
          monthly_price
        ),
        trip_schedules:schedule_id (
          time_text
        ),
        return_trip_schedule:return_schedule_id (
          time_text
        ),
        pickup_stop:pickup_stop_id (
          stop_name
        ),
        dropoff_stop:dropoff_stop_id (
          stop_name
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    }

    setBookings((data as BookingRow[] | null) ?? []);
    setLoading(false);
  }

  async function handleCancelBooking(bookingId: number) {
    setActionLoadingId(bookingId);

    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);

    if (error) console.error(error);

    await loadBookings();
    setActionLoadingId(null);
  }

  async function handleAddSeat(booking: BookingRow) {
    if (booking.status === "cancelled" || booking.status === "completed") return;

    setActionLoadingId(booking.id);

    const { error } = await supabase
      .from("bookings")
      .update({ seats: (booking.seats || 1) + 1 })
      .eq("id", booking.id);

    if (error) console.error(error);

    await loadBookings();
    setActionLoadingId(null);
  }

  async function handleRemoveSeat(booking: BookingRow) {
    if (booking.status === "cancelled" || booking.status === "completed") return;
    if ((booking.seats || 1) <= 1) return;

    setActionLoadingId(booking.id);

    const { error } = await supabase
      .from("bookings")
      .update({ seats: (booking.seats || 1) - 1 })
      .eq("id", booking.id);

    if (error) console.error(error);

    await loadBookings();
    setActionLoadingId(null);
  }

  function calcTotal(booking: BookingRow) {
    const price = Number(booking.trips?.price || 0);
    const weeklyPrice = booking.trips?.weekly_price ? Number(booking.trips.weekly_price) : null;
    const monthlyPrice = booking.trips?.monthly_price ? Number(booking.trips.monthly_price) : null;
    const seats = booking.seats || 1;
    const type = booking.booking_type || "one_way";

    if (type === "weekly") {
      return (weeklyPrice ?? price * 5) * seats;
    }

    if (type === "monthly") {
      return (monthlyPrice ?? price * 22) * seats;
    }

    if (type === "round_trip") {
      return price * 2 * seats;
    }

    return price * seats;
  }

  const filteredBookings = useMemo(() => {
    if (filter === "cancelled") {
      return bookings.filter((b) => b.status === "cancelled");
    }

    if (filter === "completed") {
      return bookings.filter((b) => b.status === "completed");
    }

    return bookings.filter(
      (b) => b.status === "pending" || b.status === "confirmed"
    );
  }, [bookings, filter]);

  function getStatusLabel(status: string) {
    if (status === "cancelled") return "ملغية";
    if (status === "completed") return "منتهية";
    if (status === "confirmed") return "مؤكدة";
    return "جارية";
  }

  function getStatusBadgeClass(status: string) {
    if (status === "cancelled") return "bg-red-50 text-red-700 ring-1 ring-red-100";
    if (status === "completed") return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
    if (status === "confirmed") return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
    return "bg-sky-50 text-sky-700 ring-1 ring-sky-100";
  }

  function getFilterButtonClass(buttonFilter: FilterType) {
    const isActive = filter === buttonFilter;

    if (buttonFilter === "current") {
      return isActive
        ? "bg-sky-600 text-white shadow-lg shadow-sky-500/20"
        : "bg-white text-sky-700 ring-1 ring-sky-100 hover:bg-sky-50";
    }

    if (buttonFilter === "completed") {
      return isActive
        ? "bg-slate-700 text-white shadow-lg shadow-slate-500/20"
        : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50";
    }

    return isActive
      ? "bg-red-600 text-white shadow-lg shadow-red-500/20"
      : "bg-white text-red-700 ring-1 ring-red-100 hover:bg-red-50";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#eef8ff] px-6 py-12 text-slate-900">
        <div className="mx-auto max-w-5xl rounded-[32px] bg-white/80 p-8 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          جاري تحميل الرحلات...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eef8ff] px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[32px] bg-white/80 p-8 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-3 inline-block rounded-full bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 ring-1 ring-sky-100">
                إدارة الحجوزات
              </p>
              <h1 className="text-3xl font-bold md:text-4xl">رحلاتي</h1>
            </div>

            <div className="flex flex-wrap gap-3">
              <button onClick={() => setFilter("current")} className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${getFilterButtonClass("current")}`}>
                الرحلات الجارية
              </button>
              <button onClick={() => setFilter("completed")} className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${getFilterButtonClass("completed")}`}>
                الرحلات المنتهية
              </button>
              <button onClick={() => setFilter("cancelled")} className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${getFilterButtonClass("cancelled")}`}>
                الرحلات الملغية
              </button>
            </div>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="rounded-[28px] bg-slate-50 p-8 text-center ring-1 ring-slate-100">
              لا يوجد رحلات في هذا القسم
            </div>
          ) : (
            <div className="grid gap-5">
              {filteredBookings.map((booking) => {
                const total = calcTotal(booking);

                return (
                  <div
                    key={booking.id}
                    className="rounded-[28px] bg-slate-50/80 p-6 shadow-sm ring-1 ring-slate-100"
                  >
                    <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h2 className="text-2xl font-bold">
                          {booking.trips?.from_location} ← {booking.trips?.to_location}
                        </h2>
                        <p className="mt-2 text-sm text-slate-500">
                          تم الحجز في {new Date(booking.created_at).toLocaleString("ar-EG")}
                        </p>
                      </div>

                      <span className={`w-fit rounded-full px-4 py-2 text-xs font-semibold ${getStatusBadgeClass(booking.status)}`}>
                        {getStatusLabel(booking.status)}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[980px] rounded-2xl bg-white ring-1 ring-slate-100">
                        <thead>
                          <tr className="border-b border-slate-100 text-right text-sm text-slate-500">
                            <th className="px-4 py-3 font-medium">تاريخ الحجز</th>
                            <th className="px-4 py-3 font-medium">نوع الحجز</th>
                            <th className="px-4 py-3 font-medium">طريقة الدفع</th>
                            <th className="px-4 py-3 font-medium">معاد الذهاب</th>
                            <th className="px-4 py-3 font-medium">موعد العودة</th>
                            <th className="px-4 py-3 font-medium">مكان الركوب</th>
                            <th className="px-4 py-3 font-medium">مكان النزول</th>
                            <th className="px-4 py-3 font-medium">عدد الكراسي</th>
                            <th className="px-4 py-3 font-medium">الإجمالي</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="text-sm text-slate-800">
                            <td className="px-4 py-4 font-semibold">{booking.booking_date || "—"}</td>
                            <td className="px-4 py-4 font-semibold">{booking.booking_type || "one_way"}</td>
                            <td className="px-4 py-4 font-semibold">{booking.payment_method || "—"}</td>
                            <td className="px-4 py-4 font-semibold">{booking.trip_schedules?.time_text || "—"}</td>
                            <td className="px-4 py-4 font-semibold">{booking.return_trip_schedule?.time_text || "—"}</td>
                            <td className="px-4 py-4 font-semibold">{booking.pickup_stop?.stop_name || "—"}</td>
                            <td className="px-4 py-4 font-semibold">{booking.dropoff_stop?.stop_name || "—"}</td>
                            <td className="px-4 py-4 font-semibold">{booking.seats}</td>
                            <td className="px-4 py-4 font-bold text-sky-700">{total} EGP</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {booking.return_trip_schedule && (
                      <div className="mt-4 rounded-2xl bg-sky-50 p-4 text-sm text-sky-700 ring-1 ring-sky-100">
                        ملاحظة: في رحلة العودة، نقطة الالتقاء للعودة = نقطة النزول في الذهاب.
                      </div>
                    )}

                    {booking.status !== "cancelled" && booking.status !== "completed" && (
                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          onClick={() => handleAddSeat(booking)}
                          disabled={actionLoadingId === booking.id}
                          className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                        >
                          {actionLoadingId === booking.id ? "جاري التحديث..." : "➕ إضافة كرسي"}
                        </button>

                        <button
                          onClick={() => handleRemoveSeat(booking)}
                          disabled={actionLoadingId === booking.id || (booking.seats || 1) <= 1}
                          className="rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60"
                        >
                          ➖ إزالة كرسي
                        </button>

                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          disabled={actionLoadingId === booking.id}
                          className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                        >
                          {actionLoadingId === booking.id ? "جاري الإلغاء..." : "إلغاء الحجز"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}