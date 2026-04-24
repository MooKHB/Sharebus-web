"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lip/supabase-client";
import Toast from "../../components/Toast";


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
  user_id: string;
  trip_id: number;
  booking_date: string | null;
  payment_method: string | null;
  booking_type: string | null;
  seats: number;
  status: string;
  confirmed_driver_id: number | null;
  confirmed_vehicle_id: number | null;
};

type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
};

type Trip = {
  id: number;
  from_location: string;
  to_location: string;
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, Profile>>({});
  const [tripsMap, setTripsMap] = useState<Record<number, Trip>>({});
  const [driversMap, setDriversMap] = useState<Record<number, Driver>>({});
  const [vehiclesMap, setVehiclesMap] = useState<Record<number, Vehicle>>({});
  const [selectedDriver, setSelectedDriver] = useState<Record<number, string>>({});
  const [selectedVehicle, setSelectedVehicle] = useState<Record<number, string>>({});
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  async function loadAll() {
    setMessage("");

    const { data: bookingsData, error: bookingsError } = await supabase
      .from("bookings")
      .select(`
        id,
        user_id,
        trip_id,
        booking_date,
        payment_method,
        booking_type,
        seats,
        status,
        confirmed_driver_id,
        confirmed_vehicle_id
      `)
      .order("id", { ascending: false });

    if (bookingsError) {
      setMessage(`حصل خطأ أثناء تحميل الحجوزات: ${bookingsError.message}`);
      return;
    }

    const safeBookings = (bookingsData as Booking[] | null) ?? [];
    setBookings(safeBookings);

    const userIds = [...new Set(safeBookings.map((b) => b.user_id).filter(Boolean))];
    const tripIds = [...new Set(safeBookings.map((b) => b.trip_id).filter(Boolean))];
    const confirmedDriverIds = [...new Set(
      safeBookings.map((b) => b.confirmed_driver_id).filter(Boolean)
    )] as number[];
    const confirmedVehicleIds = [...new Set(
      safeBookings.map((b) => b.confirmed_vehicle_id).filter(Boolean)
    )] as number[];

    if (userIds.length) {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, phone, email")
        .in("id", userIds);

      const map: Record<string, Profile> = {};
      ((data as Profile[] | null) ?? []).forEach((item) => {
        map[item.id] = item;
      });
      setProfilesMap(map);
    } else {
      setProfilesMap({});
    }

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

    setDrivers((driversData as Driver[] | null) ?? []);
    setVehicles((vehiclesData as Vehicle[] | null) ?? []);

    const allDriversMap: Record<number, Driver> = {};
    ((driversData as Driver[] | null) ?? []).forEach((item) => {
      allDriversMap[item.id] = item;
    });

    if (confirmedDriverIds.length) {
      const { data } = await supabase
        .from("drivers")
        .select("id, full_name")
        .in("id", confirmedDriverIds);

      ((data as Driver[] | null) ?? []).forEach((item) => {
        allDriversMap[item.id] = item;
      });
    }

    setDriversMap(allDriversMap);

    const allVehiclesMap: Record<number, Vehicle> = {};
    ((vehiclesData as Vehicle[] | null) ?? []).forEach((item) => {
      allVehiclesMap[item.id] = item;
    });

    if (confirmedVehicleIds.length) {
      const { data } = await supabase
        .from("vehicles")
        .select("id, name, plate_number")
        .in("id", confirmedVehicleIds);

      ((data as Vehicle[] | null) ?? []).forEach((item) => {
        allVehiclesMap[item.id] = item;
      });
    }

    setVehiclesMap(allVehiclesMap);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function confirmBooking(bookingId: number) {
    const driverId = selectedDriver[bookingId];
    const vehicleId = selectedVehicle[bookingId];

    if (!driverId || !vehicleId) {
      setMessage("اختار سواق وعربية أولًا");
      return;
    }

    const { error } = await supabase
      .from("bookings")
      .update({
        status: "confirmed",
        confirmed_driver_id: Number(driverId),
        confirmed_vehicle_id: Number(vehicleId),
      })
      .eq("id", bookingId);

    if (error) {
      setMessage(`حصل خطأ أثناء تأكيد الحجز: ${error.message}`);
      return;
    }

    setMessage("تم تأكيد الحجز وربطه بالسواق والعربية");
    loadAll();
  }

  async function markCompleted(bookingId: number) {
    const { error } = await supabase
      .from("bookings")
      .update({ status: "completed" })
      .eq("id", bookingId);

    if (error) {
      setMessage(`حصل خطأ أثناء إنهاء الحجز: ${error.message}`);
      return;
    }

    setMessage("تم إنهاء الحجز");
    loadAll();
  }

  async function cancelBooking(bookingId: number) {
  setMessage("");

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

  setMessage(data?.message || "تم إلغاء الحجز");
  loadAll();
}

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const profile = profilesMap[booking.user_id];
      const trip = tripsMap[booking.trip_id];

      const matchesStatus =
        statusFilter === "all" || booking.status === statusFilter;
      const matchesPayment =
        paymentFilter === "all" || booking.payment_method === paymentFilter;
      const matchesType =
        typeFilter === "all" || booking.booking_type === typeFilter;

      const q = search.trim().toLowerCase();
      const haystack = [
        profile?.full_name,
        profile?.phone,
        profile?.email,
        trip?.from_location,
        trip?.to_location,
        booking.booking_date,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !q || haystack.includes(q);

      return matchesStatus && matchesPayment && matchesType && matchesSearch;
    });
  }, [bookings, profilesMap, tripsMap, statusFilter, paymentFilter, typeFilter, search]);

  return (
    <main className="min-h-screen bg-[#eef8ff] px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[32px] bg-white/80 p-8 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">إدارة الحجوزات</h1>
              <p className="mt-2 text-sm text-slate-500">
                متابعة كل الحجوزات وربطها بالسواقين والعربيات.
              </p>
            </div>

            <button
              type="button"
              onClick={loadAll}
              className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white"
            >
              Sync / Refresh
            </button>
          </div>
        </div>

        <div className="rounded-[32px] bg-white/80 p-5 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-5">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالعميل أو الرحلة أو التاريخ"
              className="rounded-2xl border border-slate-200 px-4 py-3"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3"
            >
              <option value="all">كل الحالات</option>
              <option value="pending">pending</option>
              <option value="confirmed">confirmed</option>
              <option value="completed">completed</option>
              <option value="cancelled">cancelled</option>
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3"
            >
              <option value="all">كل طرق الدفع</option>
              <option value="cash">cash</option>
              <option value="instapay">instapay</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3"
            >
              <option value="all">كل أنواع الحجز</option>
              <option value="one_way">one_way</option>
              <option value="round_trip">round_trip</option>
              <option value="weekly">weekly</option>
              <option value="monthly">monthly</option>
            </select>

            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-100">
              النتائج: {filteredBookings.length}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/80 px-4 py-3 text-center text-sm whitespace-pre-line shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          {message || "—"}
        </div>

        <div className="overflow-x-auto rounded-[32px] bg-white/80 p-4 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <table className="w-full min-w-[1600px]">
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
              {filteredBookings.map((booking) => {
                const profile = profilesMap[booking.user_id];
                const trip = tripsMap[booking.trip_id];
                const currentDriver = booking.confirmed_driver_id
                  ? driversMap[booking.confirmed_driver_id]
                  : null;
                const currentVehicle = booking.confirmed_vehicle_id
                  ? vehiclesMap[booking.confirmed_vehicle_id]
                  : null;

                return (
                  <tr key={booking.id} className="border-b border-slate-100 text-sm">
                    <td className="px-4 py-4">{booking.id}</td>

                    <td className="px-4 py-4">
                      <div>{profile?.full_name || "—"}</div>
                      <div className="text-xs text-slate-500">{profile?.phone || "—"}</div>
                      <div className="text-xs text-slate-500">{profile?.email || "—"}</div>
                    </td>

                    <td className="px-4 py-4">
                      {trip ? `${trip.from_location} ← ${trip.to_location}` : "—"}
                    </td>

                    <td className="px-4 py-4">{booking.booking_date || "—"}</td>
                    <td className="px-4 py-4">{booking.booking_type || "—"}</td>
                    <td className="px-4 py-4">{booking.payment_method || "—"}</td>
                    <td className="px-4 py-4">{booking.seats}</td>
                    <td className="px-4 py-4">{booking.status}</td>
                    <td className="px-4 py-4">{currentDriver?.full_name || "—"}</td>
                    <td className="px-4 py-4">
                      {currentVehicle
                        ? `${currentVehicle.name} - ${currentVehicle.plate_number || ""}`
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
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => confirmBooking(booking.id)}
                          className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white"
                        >
                          Confirm
                        </button>

                        <button
                          type="button"
                          onClick={() => markCompleted(booking.id)}
                          className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-medium text-white"
                        >
                          إنهاء
                        </button>

                        <button
                          type="button"
                          onClick={() => cancelBooking(booking.id)}
                          className="rounded-xl bg-red-600 px-4 py-2 text-xs font-medium text-white"
                        >
                          إلغاء
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredBookings.length === 0 && (
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