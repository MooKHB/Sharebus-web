"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lip/supabase-client";

type Driver = {
  id: number;
  full_name: string;
};

type Vehicle = {
  id: number;
  name: string;
  plate_number: string;
};

type Booking = {
  id: number;
  status: string;
  booking_date: string | null;
  payment_method: string | null;
  booking_type: string | null;
  seats: number;
  trips: {
    from_location: string;
    to_location: string;
  } | null;
  profiles: {
    full_name: string | null;
    phone: string | null;
    email: string | null;
  } | null;
  drivers: {
    full_name: string | null;
  } | null;
  vehicles: {
    name: string | null;
    plate_number: string | null;
  } | null;
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Record<number, string>>({});
  const [selectedVehicle, setSelectedVehicle] = useState<Record<number, string>>({});

  async function loadAll() {
    const { data: bookingsData } = await supabase
      .from("bookings")
      .select(`
        id,
        status,
        booking_date,
        payment_method,
        booking_type,
        seats,
        trips:trip_id (
          from_location,
          to_location
        ),
        profiles:user_id (
          full_name,
          phone,
          email
        ),
        drivers:confirmed_driver_id (
          full_name
        ),
        vehicles:confirmed_vehicle_id (
          name,
          plate_number
        )
      `)
      .order("id", { ascending: false });

    const { data: driversData } = await supabase
      .from("drivers")
      .select("id, full_name")
      .eq("is_active", true)
      .order("id", { ascending: true });

    const { data: vehiclesData } = await supabase
      .from("vehicles")
      .select("id, name, plate_number")
      .eq("is_active", true)
      .order("id", { ascending: true });

    setBookings((bookingsData as Booking[] | null) ?? []);
    setDrivers((driversData as Driver[] | null) ?? []);
    setVehicles((vehiclesData as Vehicle[] | null) ?? []);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function confirmBooking(bookingId: number) {
    const driverId = selectedDriver[bookingId];
    const vehicleId = selectedVehicle[bookingId];

    if (!driverId || !vehicleId) {
      alert("اختار سواق وعربية أولًا");
      return;
    }

    const { error } = await supabase
      .from("bookings")
      .update({
        status: "confirmed",
        confirmed_driver_id: Number(driverId),
        confirmed_vehicle_id: Number(vehicleId),
        confirmed_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    if (error) {
      alert("حصل خطأ أثناء تأكيد الحجز");
      return;
    }

    loadAll();
  }

  return (
    <main className="min-h-screen bg-[#eef8ff] px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[32px] bg-white/80 p-8 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <h1 className="text-3xl font-bold">إدارة الحجوزات</h1>
        </div>

        <div className="overflow-x-auto rounded-[32px] bg-white/80 p-4 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <table className="w-full min-w-[1500px]">
            <thead>
              <tr className="border-b border-slate-100 text-right text-sm text-slate-500">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">العميل</th>
                <th className="px-4 py-3">الرحلة</th>
                <th className="px-4 py-3">تاريخ الحجز</th>
                <th className="px-4 py-3">نوع الحجز</th>
                <th className="px-4 py-3">الدفع</th>
                <th className="px-4 py-3">الكراسي</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3">السواق الحالي</th>
                <th className="px-4 py-3">العربية الحالية</th>
                <th className="px-4 py-3">اختيار سواق</th>
                <th className="px-4 py-3">اختيار عربية</th>
                <th className="px-4 py-3">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="border-b border-slate-100 text-sm">
                  <td className="px-4 py-4">{booking.id}</td>
                  <td className="px-4 py-4">
                    <div>{booking.profiles?.full_name || "—"}</div>
                    <div className="text-xs text-slate-500">{booking.profiles?.phone || "—"}</div>
                    <div className="text-xs text-slate-500">{booking.profiles?.email || "—"}</div>
                  </td>
                  <td className="px-4 py-4">
                    {booking.trips?.from_location} ← {booking.trips?.to_location}
                  </td>
                  <td className="px-4 py-4">{booking.booking_date || "—"}</td>
                  <td className="px-4 py-4">{booking.booking_type || "—"}</td>
                  <td className="px-4 py-4">{booking.payment_method || "—"}</td>
                  <td className="px-4 py-4">{booking.seats}</td>
                  <td className="px-4 py-4">{booking.status}</td>
                  <td className="px-4 py-4">{booking.drivers?.full_name || "—"}</td>
                  <td className="px-4 py-4">
                    {booking.vehicles?.name
                      ? `${booking.vehicles.name} - ${booking.vehicles.plate_number || ""}`
                      : "—"}
                  </td>
                  <td className="px-4 py-4">
                    <select
                      value={selectedDriver[booking.id] ?? ""}
                      onChange={(e) =>
                        setSelectedDriver((prev) => ({
                          ...prev,
                          [booking.id]: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    >
                      <option value="">اختار سواق</option>
                      {drivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.full_name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <select
                      value={selectedVehicle[booking.id] ?? ""}
                      onChange={(e) =>
                        setSelectedVehicle((prev) => ({
                          ...prev,
                          [booking.id]: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    >
                      <option value="">اختار عربية</option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.name} - {vehicle.plate_number}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => confirmBooking(booking.id)}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white"
                    >
                      Confirm
                    </button>
                  </td>
                </tr>
              ))}

              {bookings.length === 0 && (
                <tr>
                  <td colSpan={13} className="px-4 py-8 text-center text-slate-500">
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