"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lip/supabase-client";

type Subscription = {
  id: number;
  plan_type: "weekly" | "monthly";
  total_credits: number;
  remaining_credits: number;
  starts_at: string;
  expires_at: string;
  status: string;
  profiles: {
    full_name: string | null;
    phone: string | null;
    email: string | null;
  } | null;
  trips: {
    from_location: string;
    to_location: string;
  } | null;
};

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  useEffect(() => {
    async function loadSubs() {
      const { data } = await supabase
        .from("subscriptions")
        .select(`
          *,
          profiles:user_id (
            full_name,
            phone,
            email
          ),
          trips:trip_id (
            from_location,
            to_location
          )
        `)
        .order("id", { ascending: false });

      setSubscriptions((data as Subscription[] | null) ?? []);
    }

    loadSubs();
  }, []);

  return (
    <main className="min-h-screen bg-[#eef8ff] px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[32px] bg-white/80 p-8 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <h1 className="text-3xl font-bold">إدارة الاشتراكات</h1>
        </div>

        <div className="overflow-x-auto rounded-[32px] bg-white/80 p-4 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <table className="w-full min-w-[1200px]">
            <thead>
              <tr className="border-b border-slate-100 text-right text-sm text-slate-500">
                <th className="px-4 py-3">العميل</th>
                <th className="px-4 py-3">الرحلة</th>
                <th className="px-4 py-3">النوع</th>
                <th className="px-4 py-3">الإجمالي</th>
                <th className="px-4 py-3">المتبقي</th>
                <th className="px-4 py-3">البداية</th>
                <th className="px-4 py-3">الانتهاء</th>
                <th className="px-4 py-3">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="border-b border-slate-100 text-sm">
                  <td className="px-4 py-4">
                    <div>{sub.profiles?.full_name || "—"}</div>
                    <div className="text-xs text-slate-500">{sub.profiles?.phone || "—"}</div>
                    <div className="text-xs text-slate-500">{sub.profiles?.email || "—"}</div>
                  </td>
                  <td className="px-4 py-4">
                    {sub.trips?.from_location} ← {sub.trips?.to_location}
                  </td>
                  <td className="px-4 py-4">
                    {sub.plan_type === "weekly" ? "أسبوعي" : "شهري"}
                  </td>
                  <td className="px-4 py-4">{sub.total_credits}</td>
                  <td className="px-4 py-4 font-bold text-sky-700">{sub.remaining_credits}</td>
                  <td className="px-4 py-4">{sub.starts_at}</td>
                  <td className="px-4 py-4">{sub.expires_at}</td>
                  <td className="px-4 py-4">{sub.status}</td>
                </tr>
              ))}

              {subscriptions.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    لا توجد اشتراكات
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