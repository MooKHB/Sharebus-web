"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lip/supabase-client";

type Subscription = {
  id: number;
  user_id: string;
  trip_id: number;
  plan_type: "weekly" | "monthly";
  total_credits: number;
  remaining_credits: number;
  starts_at: string;
  expires_at: string;
  status: string;
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

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, Profile>>({});
  const [tripsMap, setTripsMap] = useState<Record<number, Trip>>({});
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  async function loadSubscriptions() {
    setMessage("");

    await supabase.rpc("expire_old_subscriptions");

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      setMessage(`حصل خطأ أثناء تحميل الاشتراكات: ${error.message}`);
      return;
    }

    const safeSubs = (data as Subscription[] | null) ?? [];
    setSubscriptions(safeSubs);

    const userIds = [...new Set(safeSubs.map((s) => s.user_id).filter(Boolean))];
    const tripIds = [...new Set(safeSubs.map((s) => s.trip_id).filter(Boolean))];

    if (userIds.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, phone, email")
        .in("id", userIds);

      const map: Record<string, Profile> = {};
      ((profiles as Profile[] | null) ?? []).forEach((item) => {
        map[item.id] = item;
      });
      setProfilesMap(map);
    } else {
      setProfilesMap({});
    }

    if (tripIds.length) {
      const { data: trips } = await supabase
        .from("trips")
        .select("id, from_location, to_location")
        .in("id", tripIds);

      const map: Record<number, Trip> = {};
      ((trips as Trip[] | null) ?? []).forEach((item) => {
        map[item.id] = item;
      });
      setTripsMap(map);
    } else {
      setTripsMap({});
    }
  }

  useEffect(() => {
    loadSubscriptions();
  }, []);

  async function markExpired(id: number) {
    const { error } = await supabase
      .from("subscriptions")
      .update({ status: "expired" })
      .eq("id", id);

    if (error) {
      setMessage(`حصل خطأ أثناء تحديث الاشتراك: ${error.message}`);
      return;
    }

    setMessage("تم تحديث حالة الاشتراك");
    loadSubscriptions();
  }

  async function cancelSubscription(id: number) {
    const { error } = await supabase
      .from("subscriptions")
      .update({ status: "cancelled" })
      .eq("id", id);

    if (error) {
      setMessage(`حصل خطأ أثناء إلغاء الاشتراك: ${error.message}`);
      return;
    }

    setMessage("تم إلغاء الاشتراك");
    loadSubscriptions();
  }

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => {
      const profile = profilesMap[sub.user_id];
      const trip = tripsMap[sub.trip_id];

      const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
      const matchesPlan = planFilter === "all" || sub.plan_type === planFilter;

      const q = search.trim().toLowerCase();
      const haystack = [
        profile?.full_name,
        profile?.phone,
        profile?.email,
        trip?.from_location,
        trip?.to_location,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !q || haystack.includes(q);

      return matchesStatus && matchesPlan && matchesSearch;
    });
  }, [subscriptions, profilesMap, tripsMap, statusFilter, planFilter, search]);

  return (
    <main className="min-h-screen bg-[#eef8ff] px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[32px] bg-white/80 p-8 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">إدارة الاشتراكات</h1>
              <p className="mt-2 text-sm text-slate-500">
                متابعة اشتراكات العملاء والرصيد المتبقي وتاريخ الانتهاء.
              </p>
            </div>

            <button
              type="button"
              onClick={loadSubscriptions}
              className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white"
            >
              Sync / Refresh
            </button>
          </div>
        </div>

        <div className="rounded-[32px] bg-white/80 p-5 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <div className="grid gap-3 md:grid-cols-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالعميل أو الرحلة"
              className="rounded-2xl border border-slate-200 px-4 py-3"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3"
            >
              <option value="all">كل الحالات</option>
              <option value="active">active</option>
              <option value="expired">expired</option>
              <option value="cancelled">cancelled</option>
            </select>

            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3"
            >
              <option value="all">كل الأنواع</option>
              <option value="weekly">weekly</option>
              <option value="monthly">monthly</option>
            </select>

            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-100">
              النتائج: {filteredSubscriptions.length}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/80 px-4 py-3 text-center text-sm whitespace-pre-line shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          {message || "—"}
        </div>

        <div className="overflow-x-auto rounded-[32px] bg-white/80 p-4 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <table className="w-full min-w-[1400px]">
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
                <th className="px-4 py-3">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubscriptions.map((sub) => {
                const profile = profilesMap[sub.user_id];
                const trip = tripsMap[sub.trip_id];

                return (
                  <tr key={sub.id} className="border-b border-slate-100 text-sm">
                    <td className="px-4 py-4">
                      <div>{profile?.full_name || "—"}</div>
                      <div className="text-xs text-slate-500">
                        {profile?.phone || "—"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {profile?.email || "—"}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      {trip ? `${trip.from_location} ← ${trip.to_location}` : "—"}
                    </td>

                    <td className="px-4 py-4">
                      {sub.plan_type === "weekly" ? "أسبوعي" : "شهري"}
                    </td>

                    <td className="px-4 py-4">{sub.total_credits}</td>
                    <td className="px-4 py-4 font-bold text-sky-700">{sub.remaining_credits}</td>
                    <td className="px-4 py-4">{sub.starts_at}</td>
                    <td className="px-4 py-4">{sub.expires_at}</td>
                    <td className="px-4 py-4">{sub.status}</td>

                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => markExpired(sub.id)}
                          className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-medium text-white"
                        >
                          Expire
                        </button>

                        <button
                          type="button"
                          onClick={() => cancelSubscription(sub.id)}
                          className="rounded-xl bg-red-600 px-4 py-2 text-xs font-medium text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredSubscriptions.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
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