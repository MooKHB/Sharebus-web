"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lip/supabase-client";

type Rider = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  is_blocked: boolean;
  is_active: boolean;
  created_at?: string | null;
};

export default function RidersPage() {
  const [riders, setRiders] = useState<Rider[]>([]);

  async function loadRiders() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    setRiders((data as Rider[] | null) ?? []);
  }

  useEffect(() => {
    loadRiders();
  }, []);

  async function toggleBlock(rider: Rider) {
    await supabase
      .from("profiles")
      .update({ is_blocked: !rider.is_blocked })
      .eq("id", rider.id);

    loadRiders();
  }

  async function toggleActive(rider: Rider) {
    await supabase
      .from("profiles")
      .update({ is_active: !rider.is_active })
      .eq("id", rider.id);

    loadRiders();
  }

  return (
    <main className="min-h-screen bg-[#eef8ff] px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[32px] bg-white/80 p-8 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <h1 className="text-3xl font-bold">Users / Riders</h1>
          <p className="mt-2 text-sm text-slate-500">
            متابعة كل العملاء والتحكم في حالتهم.
          </p>
        </div>

        <div className="overflow-x-auto rounded-[32px] bg-white/80 p-4 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="border-b border-slate-100 text-right text-sm text-slate-500">
                <th className="px-4 py-3">الاسم</th>
                <th className="px-4 py-3">التليفون</th>
                <th className="px-4 py-3">الإيميل</th>
                <th className="px-4 py-3">نشط</th>
                <th className="px-4 py-3">محظور</th>
                <th className="px-4 py-3">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {riders.map((rider) => (
                <tr key={rider.id} className="border-b border-slate-100 text-sm">
                  <td className="px-4 py-4">{rider.full_name || "—"}</td>
                  <td className="px-4 py-4">{rider.phone || "—"}</td>
                  <td className="px-4 py-4">{rider.email || "—"}</td>
                  <td className="px-4 py-4">{rider.is_active ? "نعم" : "لا"}</td>
                  <td className="px-4 py-4">{rider.is_blocked ? "نعم" : "لا"}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => toggleActive(rider)}
                        className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-medium text-white"
                      >
                        {rider.is_active ? "إيقاف" : "تفعيل"}
                      </button>

                      <button
                        onClick={() => toggleBlock(rider)}
                        className="rounded-xl bg-red-600 px-4 py-2 text-xs font-medium text-white"
                      >
                        {rider.is_blocked ? "إلغاء الحظر" : "حظر"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {riders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    لا يوجد Users حتى الآن
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