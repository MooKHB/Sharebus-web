"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lip/supabase-client";

type Trip = {
  id: number;
  from_location: string;
  to_location: string;
  time_text: string;
  price: number;
  is_active: boolean;
  supports_round_trip: boolean;
  allow_weekly_subscription: boolean;
  allow_monthly_subscription: boolean;
};

export default function AdminTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [subFilter, setSubFilter] = useState("all");
  const [message, setMessage] = useState("");

  async function loadTrips() {
    setMessage("");

    const { data, error } = await supabase
      .from("trips")
      .select(`
        id,
        from_location,
        to_location,
        time_text,
        price,
        is_active,
        supports_round_trip,
        allow_weekly_subscription,
        allow_monthly_subscription
      `)
      .order("id", { ascending: false });

    if (error) {
      setMessage(`حصل خطأ أثناء تحميل الرحلات: ${error.message}`);
      return;
    }

    setTrips((data as Trip[] | null) ?? []);
  }

  useEffect(() => {
    loadTrips();
  }, []);

  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      const q = search.trim().toLowerCase();
      const haystack = `${trip.from_location} ${trip.to_location} ${trip.time_text}`.toLowerCase();

      const matchesSearch = !q || haystack.includes(q);
      const matchesActive =
        activeFilter === "all" ||
        (activeFilter === "active" && trip.is_active) ||
        (activeFilter === "inactive" && !trip.is_active);

      const hasSubscription =
        trip.allow_weekly_subscription || trip.allow_monthly_subscription;

      const matchesSub =
        subFilter === "all" ||
        (subFilter === "subscriptions" && hasSubscription) ||
        (subFilter === "roundtrip" && trip.supports_round_trip);

      return matchesSearch && matchesActive && matchesSub;
    });
  }, [trips, search, activeFilter, subFilter]);

  return (
    <main className="min-h-screen bg-[#eef8ff] px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[32px] bg-white/80 p-8 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">إدارة الرحلات</h1>
              <p className="mt-2 text-sm text-slate-500">
                تعديل الرحلات، المواعيد، نقاط الالتقاء، الأيام المتاحة وطرق الدفع.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={loadTrips}
                className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white"
              >
                Sync / Refresh
              </button>

              <Link
                href="/admin/trips/new"
                className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white"
              >
                إضافة رحلة جديدة
              </Link>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] bg-white/80 p-5 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <div className="grid gap-3 md:grid-cols-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالمسار أو الوقت"
              className="rounded-2xl border border-slate-200 px-4 py-3"
            />

            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3"
            >
              <option value="all">كل الحالات</option>
              <option value="active">مفعلة</option>
              <option value="inactive">متوقفة</option>
            </select>

            <select
              value={subFilter}
              onChange={(e) => setSubFilter(e.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3"
            >
              <option value="all">كل الأنواع</option>
              <option value="subscriptions">فيها اشتراكات</option>
              <option value="roundtrip">ذهاب وعودة</option>
            </select>

            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-100">
              النتائج: {filteredTrips.length}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/80 px-4 py-3 text-center text-sm whitespace-pre-line shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          {message || "—"}
        </div>

        <div className="overflow-x-auto rounded-[32px] bg-white/80 p-4 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <table className="w-full min-w-[1200px]">
            <thead>
              <tr className="border-b border-slate-100 text-right text-sm text-slate-500">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">المسار</th>
                <th className="px-4 py-3">الوقت</th>
                <th className="px-4 py-3">السعر</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3">ميزات</th>
                <th className="px-4 py-3">إدارة</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrips.map((trip) => (
                <tr key={trip.id} className="border-b border-slate-100 text-sm">
                  <td className="px-4 py-4">{trip.id}</td>
                  <td className="px-4 py-4">
                    {trip.from_location} ← {trip.to_location}
                  </td>
                  <td className="px-4 py-4">{trip.time_text}</td>
                  <td className="px-4 py-4">{trip.price} EGP</td>
                  <td className="px-4 py-4">{trip.is_active ? "مفعلة" : "متوقفة"}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {trip.supports_round_trip && (
                        <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 ring-1 ring-violet-100">
                          ذهاب وعودة
                        </span>
                      )}
                      {(trip.allow_weekly_subscription || trip.allow_monthly_subscription) && (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                          اشتراكات
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/trips/${trip.id}`}
                        className="rounded-xl bg-slate-100 px-4 py-2 text-xs"
                      >
                        تعديل
                      </Link>
                      <Link
                        href={`/admin/trips/${trip.id}/stops`}
                        className="rounded-xl bg-slate-100 px-4 py-2 text-xs"
                      >
                        النقاط
                      </Link>
                      <Link
                        href={`/admin/trips/${trip.id}/schedules`}
                        className="rounded-xl bg-slate-100 px-4 py-2 text-xs"
                      >
                        المواعيد
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredTrips.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    لا توجد رحلات
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