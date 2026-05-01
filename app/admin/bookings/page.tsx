"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lip/supabase-client";

type RelationOneOrMany<T> = T | T[] | null;

type BookingRow = {
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
  confirmed_driver_id: number | null;
  confirmed_vehicle_id: number | null;

  trips: RelationOneOrMany<{
    from_location: string | null;
    to_location: string | null;
  }>;

  pickup_stop: RelationOneOrMany<{
    stop_name: string | null;
    lat: number | null;
    lng: number | null;
  }>;

  dropoff_stop: RelationOneOrMany<{
    stop_name: string | null;
    lat: number | null;
    lng: number | null;
  }>;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
};

function mapsLink(lat?: number | null, lng?: number | null) {
  if (lat == null || lng == null) return null;
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

function getOne<T>(value: RelationOneOrMany<T>): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function getTripLabel(booking: BookingRow) {
  const trip = getOne(booking.trips);
  const from = trip?.from_location || "—";
  const to = trip?.to_location || "—";
  return `${from} ← ${to}`;
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, ProfileRow>>({});
  const [message, setMessage] = useState("");

  const [bookingTypeFilter, setBookingTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [tripFilter, setTripFilter] = useState("all");

  const bookingTypes = useMemo(() => {
    const types = bookings
      .map((booking) => booking.booking_type)
      .filter((type): type is string => Boolean(type));

    return ["all", ...Array.from(new Set(types))];
  }, [bookings]);

  const statuses = useMemo(() => {
    const items = bookings
      .map((booking) => booking.status)
      .filter((status): status is string => Boolean(status));

    return ["all", ...Array.from(new Set(items))];
  }, [bookings]);

  const paymentMethods = useMemo(() => {
    const methods = bookings
      .map((booking) => booking.payment_method)
      .filter((method): method is string => Boolean(method));

    return ["all", ...Array.from(new Set(methods))];
  }, [bookings]);

  const trips = useMemo(() => {
    const tripMap = new Map<number, string>();

    bookings.forEach((booking) => {
      if (!booking.trip_id) return;
      tripMap.set(booking.trip_id, getTripLabel(booking));
    });

    return [
      { value: "all", label: "كل الرحلات" },
      ...Array.from(tripMap.entries()).map(([id, label]) => ({
        value: String(id),
        label,
      })),
    ];
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const matchType =
        bookingTypeFilter === "all" ||
        booking.booking_type === bookingTypeFilter;

      const matchStatus =
        statusFilter === "all" || booking.status === statusFilter;

      const matchPayment =
        paymentFilter === "all" || booking.payment_method === paymentFilter;

      const matchTrip =
        tripFilter === "all" || String(booking.trip_id) === tripFilter;

      return matchType && matchStatus && matchPayment && matchTrip;
    });
  }, [bookings, bookingTypeFilter, statusFilter, paymentFilter, tripFilter]);

  async function loadAll() {
    setMessage("");

    const { data, error } = await supabase
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
        confirmed_driver_id,
        confirmed_vehicle_id,
        trips:trip_id (
          from_location,
          to_location
        ),
        pickup_stop:pickup_stop_id (
          stop_name,
          lat,
          lng
        ),
        dropoff_stop:dropoff_stop_id (
          stop_name,
          lat,
          lng
        )
      `)
      .order("id", { ascending: false });

    if (error) {
      setMessage(`حصل خطأ أثناء تحميل الحجوزات: ${error.message}`);
      return;
    }

    const rows = (data as unknown as BookingRow[] | null) ?? [];
    setBookings(rows);

    const userIds = [...new Set(rows.map((b) => b.user_id).filter(Boolean))];

    if (userIds.length) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, phone, email")
        .in("id", userIds);

      if (profilesError) {
        setMessage(
          `تم تحميل الحجوزات، لكن حصل خطأ أثناء تحميل بيانات العملاء: ${profilesError.message}`
        );
        return;
      }

      const map: Record<string, ProfileRow> = {};
      ((profiles as ProfileRow[] | null) ?? []).forEach((profile) => {
        map[profile.id] = profile;
      });

      setProfilesMap(map);
    } else {
      setProfilesMap({});
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function cancelBooking(bookingId: number) {
    const confirmed = window.confirm("هل أنت متأكد من إلغاء هذا الحجز؟");
    if (!confirmed) return;

    const { data, error } = await supabase.rpc("cancel_booking_by_id", {
      p_booking_id: bookingId,
      p_user_id: null,
      p_is_admin: true,
    });

    if (error) {
      setMessage(`حصل خطأ أثناء إلغاء الحجز: ${error.message}`);
      return;
    }

    if (!data?.success) {
      setMessage(data?.message || "تعذر إلغاء الحجز");
      return;
    }

    setMessage("تم إلغاء الحجز");
    loadAll();
  }

  return (
    <main className="min-h-screen bg-[#eef8ff] px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[32px] bg-white/80 p-8 shadow-xl shadow-sky-900/5 ring-1 ring-white/70">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">إدارة الحجوزات</h1>
              <p className="mt-2 text-sm text-slate-500">
                متابعة الحجوزات، نقاط الالتقاء والنزول، وحالة كل حجز.
              </p>
            </div>

            <button
              type="button"
              onClick={loadAll}
              className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="rounded-[28px] bg-white/80 p-5 shadow-xl shadow-sky-900/5 ring-1 ring-white/70">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold">فلترة الحجوزات</h2>
              <p className="mt-1 text-xs text-slate-500">
                اختار الفلاتر المناسبة لعرض الحجوزات المطلوبة فقط.
              </p>
            </div>

            <div className="rounded-2xl bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700">
              {filteredBookings.length} / {bookings.length}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">
                نوع الحجز
              </label>
              <select
                value={bookingTypeFilter}
                onChange={(e) => setBookingTypeFilter(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              >
                {bookingTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === "all" ? "كل أنواع الحجوزات" : type}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">
                حالة الرحلة
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status === "all" ? "كل الحالات" : status}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">
                طريقة الدفع
              </label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              >
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {method === "all" ? "كل طرق الدفع" : method}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">
                الرحلة
              </label>
              <select
                value={tripFilter}
                onChange={(e) => setTripFilter(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              >
                {trips.map((trip) => (
                  <option key={trip.value} value={trip.value}>
                    {trip.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {message && (
          <div className="rounded-2xl bg-white px-4 py-3 text-center text-sm ring-1 ring-slate-100">
            {message}
          </div>
        )}

        <div className="overflow-x-auto rounded-[32px] bg-white/80 p-4 shadow-xl shadow-sky-900/5 ring-1 ring-white/70">
          <table className="w-full min-w-[1500px]">
            <thead>
              <tr className="border-b border-slate-100 text-right text-sm text-slate-500">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">العميل</th>
                <th className="px-4 py-3">الرحلة</th>
                <th className="px-4 py-3">نقطة الالتقاء</th>
                <th className="px-4 py-3">نقطة النزول</th>
                <th className="px-4 py-3">تاريخ الحجز</th>
                <th className="px-4 py-3">نوع الحجز</th>
                <th className="px-4 py-3">الدفع</th>
                <th className="px-4 py-3">الكراسي</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3">إجراء</th>
              </tr>
            </thead>

            <tbody>
              {filteredBookings.map((booking) => {
                const profile = profilesMap[booking.user_id];

                const trip = getOne(booking.trips);
                const pickupStop = getOne(booking.pickup_stop);
                const dropoffStop = getOne(booking.dropoff_stop);

                const pickupLink = mapsLink(pickupStop?.lat, pickupStop?.lng);
                const dropoffLink = mapsLink(dropoffStop?.lat, dropoffStop?.lng);

                return (
                  <tr key={booking.id} className="border-b border-slate-100 text-sm">
                    <td className="px-4 py-4 font-semibold">{booking.id}</td>

                    <td className="px-4 py-4">
                      <div className="font-semibold">
                        {profile?.full_name || "—"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {profile?.phone || "—"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {profile?.email || "—"}
                      </div>
                    </td>

                    <td className="px-4 py-4 font-semibold">
                      {trip?.from_location || "—"} ← {trip?.to_location || "—"}
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-semibold">
                        {pickupStop?.stop_name || "—"}
                      </div>

                      {pickupLink ? (
                        <a
                          href={pickupLink}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-block text-xs font-semibold text-sky-600"
                        >
                          فتح على الخريطة
                        </a>
                      ) : (
                        <div className="mt-1 text-xs text-slate-400">
                          لا يوجد موقع
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-semibold">
                        {dropoffStop?.stop_name || "—"}
                      </div>

                      {dropoffLink ? (
                        <a
                          href={dropoffLink}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-block text-xs font-semibold text-sky-600"
                        >
                          فتح على الخريطة
                        </a>
                      ) : (
                        <div className="mt-1 text-xs text-slate-400">
                          لا يوجد موقع
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-4">{booking.booking_date || "—"}</td>
                    <td className="px-4 py-4">{booking.booking_type || "—"}</td>
                    <td className="px-4 py-4">{booking.payment_method || "—"}</td>
                    <td className="px-4 py-4">{booking.seats}</td>
                    <td className="px-4 py-4">{booking.status}</td>

                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => cancelBooking(booking.id)}
                        disabled={booking.status === "cancelled"}
                        className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white disabled:bg-slate-300"
                      >
                        إلغاء
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-slate-500">
                    لا توجد حجوزات مطابقة للفلاتر المختارة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}