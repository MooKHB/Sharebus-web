"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lip/supabase-client";

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
  trips?: {
    from_location: string | null;
    to_location: string | null;
  } | null;
  pickup_stop?: {
    stop_name: string | null;
    lat: number | null;
    lng: number | null;
  } | null;
  dropoff_stop?: {
    stop_name: string | null;
    lat: number | null;
    lng: number | null;
  } | null;
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

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, ProfileRow>>({});
  const [message, setMessage] = useState("");

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

    const rows = (data as BookingRow[] | null) ?? [];
    setBookings(rows);

    const userIds = [...new Set(rows.map((b) => b.user_id).filter(Boolean))];

    if (userIds.length) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, phone, email")
        .in("id", userIds);

      if (profilesError) {
        setMessage(`تم تحميل الحجوزات، لكن حصل خطأ أثناء تحميل بيانات العملاء: ${profilesError.message}`);
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
              {bookings.map((booking) => {
                const profile = profilesMap[booking.user_id];

                const pickupLink = mapsLink(
                  booking.pickup_stop?.lat,
                  booking.pickup_stop?.lng
                );

                const dropoffLink = mapsLink(
                  booking.dropoff_stop?.lat,
                  booking.dropoff_stop?.lng
                );

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
                      {booking.trips?.from_location || "—"} ←{" "}
                      {booking.trips?.to_location || "—"}
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-semibold">
                        {booking.pickup_stop?.stop_name || "—"}
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
                        {booking.dropoff_stop?.stop_name || "—"}
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

              {bookings.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-slate-500">
                    لا توجد حجوزات
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