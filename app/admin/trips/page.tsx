"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lip/supabase-client";

type Trip = {
  id: number;
  from_location: string;
  to_location: string;
  time_text: string;
  price: number;
  duration_text: string;
  is_active: boolean;
  allow_weekly_subscription: boolean;
  allow_monthly_subscription: boolean;
};

export default function AdminTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);

  async function loadTrips() {
    const { data, error } = await supabase
      .from("trips")
      .select("*")
      .order("id", { ascending: true });

    if (error) console.error(error);
    setTrips((data as Trip[] | null) ?? []);
  }

  useEffect(() => {
    loadTrips();
  }, []);

  async function toggleTrip(id: number, isActive: boolean) {
    await supabase.from("trips").update({ is_active: !isActive }).eq("id", id);
    loadTrips();
  }

  async function deleteTrip(id: number) {
    const confirmed = window.confirm("هل أنت متأكد من حذف الرحلة؟");
    if (!confirmed) return;

    const { error } = await supabase.from("trips").delete().eq("id", id);

    if (error) {
      alert("لم يتم حذف الرحلة. غالبًا فيها حجوزات مرتبطة، أوقفها بدل الحذف.");
      return;
    }

    loadTrips();
  }

  return (
    <main className="min-h-screen bg-[#eef8ff] px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[32px] bg-white/80 p-8 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-3 inline-block rounded-full bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 ring-1 ring-sky-100">
                إدارة الرحلات
              </p>
              <h1 className="text-3xl font-bold md:text-4xl">الرحلات</h1>
            </div>

            <Link
              href="/admin/trips/new"
              className="rounded-2xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-700"
            >
              إضافة رحلة جديدة
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto rounded-[32px] bg-white/80 p-4 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <table className="w-full min-w-[1200px]">
            <thead>
              <tr className="border-b border-slate-100 text-right text-sm text-slate-500">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">من</th>
                <th className="px-4 py-3">إلى</th>
                <th className="px-4 py-3">الوقت</th>
                <th className="px-4 py-3">السعر</th>
                <th className="px-4 py-3">أسبوعي</th>
                <th className="px-4 py-3">شهري</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((trip) => (
                <tr key={trip.id} className="border-b border-slate-100 text-sm">
                  <td className="px-4 py-4 font-medium">{trip.id}</td>
                  <td className="px-4 py-4">{trip.from_location}</td>
                  <td className="px-4 py-4">{trip.to_location}</td>
                  <td className="px-4 py-4">{trip.time_text}</td>
                  <td className="px-4 py-4">{trip.price} EGP</td>
                  <td className="px-4 py-4">{trip.allow_weekly_subscription ? "نعم" : "لا"}</td>
                  <td className="px-4 py-4">{trip.allow_monthly_subscription ? "نعم" : "لا"}</td>
                  <td className="px-4 py-4">{trip.is_active ? "مفعلة" : "متوقفة"}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/admin/trips/${trip.id}`} className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-medium transition hover:bg-slate-200">
                        تعديل
                      </Link>

                      <Link href={`/admin/trips/${trip.id}/stops`} className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-medium transition hover:bg-slate-200">
                        نقاط الالتقاء
                      </Link>

                      <Link href={`/admin/trips/${trip.id}/schedules`} className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-medium transition hover:bg-slate-200">
                        المواعيد
                      </Link>

                      <button
                        onClick={() => toggleTrip(trip.id, trip.is_active)}
                        className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-medium text-white"
                      >
                        {trip.is_active ? "إيقاف" : "تفعيل"}
                      </button>

                      <button
                        onClick={() => deleteTrip(trip.id)}
                        className="rounded-xl bg-red-600 px-4 py-2 text-xs font-medium text-white"
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {trips.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    لا توجد رحلات حتى الآن
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