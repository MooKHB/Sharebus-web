"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lip/supabase-client";

type Vehicle = {
  id: number;
  name: string;
  plate_number: string | null;
  seats_count: number | null;
  is_active: boolean;
  created_at?: string | null;
};

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState("");

  async function loadVehicles() {
    setMessage("");

    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      setMessage(`حصل خطأ أثناء تحميل العربيات: ${error.message}`);
      return;
    }

    setVehicles((data as Vehicle[] | null) ?? []);
  }

  useEffect(() => {
    loadVehicles();
  }, []);

  async function toggleVehicleStatus(vehicle: Vehicle) {
    const { error } = await supabase
      .from("vehicles")
      .update({ is_active: !vehicle.is_active })
      .eq("id", vehicle.id);

    if (error) {
      setMessage(`حصل خطأ أثناء تحديث حالة العربية: ${error.message}`);
      return;
    }

    setMessage("تم تحديث حالة العربية");
    loadVehicles();
  }

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const q = search.trim().toLowerCase();
      const haystack = [
        vehicle.name,
        vehicle.plate_number,
        String(vehicle.seats_count ?? ""),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !q || haystack.includes(q);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && vehicle.is_active) ||
        (statusFilter === "inactive" && !vehicle.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [vehicles, search, statusFilter]);

  return (
    <main className="min-h-screen bg-[#eef8ff] px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[32px] bg-white/80 p-8 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">إدارة العربيات</h1>
              <p className="mt-2 text-sm text-slate-500">
                متابعة العربيات، البحث، الفلترة، وتفعيل أو إيقاف العربية.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={loadVehicles}
                className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white"
              >
                Sync / Refresh
              </button>

              <Link
                href="/admin/vehicles/new"
                className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white"
              >
                إضافة عربية
              </Link>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] bg-white/80 p-5 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <div className="grid gap-3 md:grid-cols-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث باسم العربية أو اللوحة أو عدد الكراسي"
              className="rounded-2xl border border-slate-200 px-4 py-3"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3"
            >
              <option value="all">كل الحالات</option>
              <option value="active">نشطة</option>
              <option value="inactive">غير نشطة</option>
            </select>

            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-100">
              النتائج: {filteredVehicles.length}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/80 px-4 py-3 text-center text-sm whitespace-pre-line shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          {message || "—"}
        </div>

        <div className="overflow-x-auto rounded-[32px] bg-white/80 p-4 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-100 text-right text-sm text-slate-500">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">الاسم</th>
                <th className="px-4 py-3">اللوحة</th>
                <th className="px-4 py-3">عدد الكراسي</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="border-b border-slate-100 text-sm">
                  <td className="px-4 py-4">{vehicle.id}</td>
                  <td className="px-4 py-4 font-semibold">{vehicle.name}</td>
                  <td className="px-4 py-4">{vehicle.plate_number || "—"}</td>
                  <td className="px-4 py-4">{vehicle.seats_count || "—"}</td>
                  <td className="px-4 py-4">
                    {vehicle.is_active ? "نشطة" : "غير نشطة"}
                  </td>
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() => toggleVehicleStatus(vehicle)}
                      className={`rounded-xl px-4 py-2 text-xs font-medium text-white ${
                        vehicle.is_active ? "bg-red-600" : "bg-emerald-600"
                      }`}
                    >
                      {vehicle.is_active ? "إيقاف" : "تفعيل"}
                    </button>
                  </td>
                </tr>
              ))}

              {filteredVehicles.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    لا توجد عربيات
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