"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lip/supabase-client";

type Rider = {
  id: string;
  full_name?: string | null;
  phone?: string | null;
  role?: string | null;
  created_at?: string | null;
};

export default function AdminRidersPage() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [message, setMessage] = useState("");

  async function loadRiders() {
    setMessage("");

    const { data, error } = await supabase
      .from("profiles")
      .select("*");

    if (error) {
      setMessage(`حدث خطأ أثناء تحميل العملاء: ${error.message}`);
      return;
    }

    setRiders((data as Rider[] | null) ?? []);
  }

  useEffect(() => {
    loadRiders();
  }, []);

  const filteredRiders = useMemo(() => {
    return riders.filter((rider) => {
      const q = search.trim().toLowerCase();
      const haystack = [
        rider.full_name,
        rider.phone,
        rider.role,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !q || haystack.includes(q);
      const matchesRole = roleFilter === "all" || (rider.role || "user") === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [riders, search, roleFilter]);

  return (
    <main className="min-h-screen bg-[#eef8ff] px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[32px] bg-white/80 p-8 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Users / Riders</h1>
              <p className="mt-2 text-sm text-slate-500">
                متابعة كل العملاء المسجلين والبحث والفلترة.
              </p>
            </div>

            <button
              type="button"
              onClick={loadRiders}
              className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white"
            >
              Sync / Refresh
            </button>
          </div>
        </div>

        <div className="rounded-[32px] bg-white/80 p-5 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <div className="grid gap-3 md:grid-cols-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو الهاتف"
              className="rounded-2xl border border-slate-200 px-4 py-3"
            />

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3"
            >
              <option value="all">كل الأدوار</option>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>

            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-100">
              النتائج: {filteredRiders.length}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/80 px-4 py-3 text-center text-sm whitespace-pre-line shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          {message || "—"}
        </div>

        <div className="overflow-x-auto rounded-[32px] bg-white/80 p-4 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-100 text-right text-sm text-slate-500">
                <th className="px-4 py-3">الاسم</th>
                <th className="px-4 py-3">الهاتف</th>
                <th className="px-4 py-3">الدور</th>
                <th className="px-4 py-3">تاريخ الإنشاء</th>
              </tr>
            </thead>
            <tbody>
              {filteredRiders.map((rider) => (
                <tr key={rider.id} className="border-b border-slate-100 text-sm">
                  <td className="px-4 py-4 font-semibold">{rider.full_name || "—"}</td>
                  <td className="px-4 py-4">{rider.phone || "—"}</td>
                  <td className="px-4 py-4">{rider.role || "user"}</td>
                  <td className="px-4 py-4">{rider.created_at || "—"}</td>
                </tr>
              ))}

              {filteredRiders.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    لا يوجد عملاء
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