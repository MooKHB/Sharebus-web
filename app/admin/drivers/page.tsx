"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lip/supabase-client";

type Driver = {
  id: number;
  full_name: string;
  phone: string | null;
  national_id: string | null;
  is_active: boolean;
  created_at?: string | null;
};

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState("");

  async function loadDrivers() {
    setMessage("");

    const { data, error } = await supabase
      .from("drivers")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      setMessage(`حصل خطأ أثناء تحميل السواقين: ${error.message}`);
      return;
    }

    setDrivers((data as Driver[] | null) ?? []);
  }

  useEffect(() => {
    loadDrivers();
  }, []);

  async function toggleDriverStatus(driver: Driver) {
    const { error } = await supabase
      .from("drivers")
      .update({ is_active: !driver.is_active })
      .eq("id", driver.id);

    if (error) {
      setMessage(`حصل خطأ أثناء تحديث حالة السواق: ${error.message}`);
      return;
    }

    setMessage("تم تحديث حالة السواق");
    loadDrivers();
  }

  const filteredDrivers = useMemo(() => {
    return drivers.filter((driver) => {
      const q = search.trim().toLowerCase();
      const haystack = [
        driver.full_name,
        driver.phone,
        driver.national_id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !q || haystack.includes(q);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && driver.is_active) ||
        (statusFilter === "inactive" && !driver.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [drivers, search, statusFilter]);

  return (
    <main className="min-h-screen bg-[#eef8ff] px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[32px] bg-white/80 p-8 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">إدارة السواقين</h1>
              <p className="mt-2 text-sm text-slate-500">
                متابعة السواقين، البحث، الفلترة، وتفعيل أو إيقاف السواق.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={loadDrivers}
                className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white"
              >
                Sync / Refresh
              </button>

              <Link
                href="/admin/drivers/new"
                className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white"
              >
                إضافة سواق
              </Link>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] bg-white/80 p-5 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <div className="grid gap-3 md:grid-cols-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو الهاتف أو الرقم القومي"
              className="rounded-2xl border border-slate-200 px-4 py-3"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3"
            >
              <option value="all">كل الحالات</option>
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
            </select>

            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-100">
              النتائج: {filteredDrivers.length}
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
                <th className="px-4 py-3">الهاتف</th>
                <th className="px-4 py-3">الرقم القومي</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrivers.map((driver) => (
                <tr key={driver.id} className="border-b border-slate-100 text-sm">
                  <td className="px-4 py-4">{driver.id}</td>
                  <td className="px-4 py-4 font-semibold">{driver.full_name}</td>
                  <td className="px-4 py-4">{driver.phone || "—"}</td>
                  <td className="px-4 py-4">{driver.national_id || "—"}</td>
                  <td className="px-4 py-4">
                    {driver.is_active ? "نشط" : "غير نشط"}
                  </td>
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() => toggleDriverStatus(driver)}
                      className={`rounded-xl px-4 py-2 text-xs font-medium text-white ${
                        driver.is_active ? "bg-red-600" : "bg-emerald-600"
                      }`}
                    >
                      {driver.is_active ? "إيقاف" : "تفعيل"}
                    </button>
                  </td>
                </tr>
              ))}

              {filteredDrivers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    لا يوجد سواقين
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