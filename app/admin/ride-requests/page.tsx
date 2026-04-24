"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lip/supabase-client";

type RideRequest = {
  id: number;
  user_id: string | null;
  pickup_location: string;
  dropoff_location: string;
  preferred_time: string;
  status: string;
  created_at: string;
};

export default function AdminRideRequestsPage() {
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [message, setMessage] = useState("");

  async function loadRequests() {
    setMessage("");

    const { data, error } = await supabase
      .from("ride_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`حصل خطأ أثناء تحميل الطلبات: ${error.message}`);
      return;
    }

    setRequests((data as RideRequest[] | null) ?? []);
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function updateStatus(id: number, status: string) {
    const { error } = await supabase
      .from("ride_requests")
      .update({ status })
      .eq("id", id);

    if (error) {
      setMessage(`حصل خطأ أثناء تحديث الطلب: ${error.message}`);
      return;
    }

    setMessage("تم تحديث حالة الطلب");
    loadRequests();
  }

  return (
    <main className="min-h-screen bg-[#eef8ff] px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[32px] bg-white/80 p-8 shadow-xl shadow-sky-900/5 ring-1 ring-white/70">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">طلبات الرحلات</h1>
              <p className="mt-2 text-sm text-slate-500">
                الطلبات اللي العملاء بعتوها لما الرحلة مش موجودة.
              </p>
            </div>

            <button
              type="button"
              onClick={loadRequests}
              className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white"
            >
              Refresh
            </button>
          </div>
        </div>

        {message && (
          <div className="rounded-2xl bg-white px-4 py-3 text-center text-sm ring-1 ring-slate-100">
            {message}
          </div>
        )}

        <div className="overflow-x-auto rounded-[32px] bg-white/80 p-4 shadow-xl shadow-sky-900/5 ring-1 ring-white/70">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-100 text-right text-sm text-slate-500">
                <th className="px-4 py-3">منين</th>
                <th className="px-4 py-3">رايح فين</th>
                <th className="px-4 py-3">الميعاد</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3">تاريخ الطلب</th>
                <th className="px-4 py-3">إجراء</th>
              </tr>
            </thead>

            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="border-b border-slate-100 text-sm">
                  <td className="px-4 py-4 font-semibold">
                    {request.pickup_location}
                  </td>
                  <td className="px-4 py-4">
                    {request.dropoff_location}
                  </td>
                  <td className="px-4 py-4">
                    {request.preferred_time}
                  </td>
                  <td className="px-4 py-4">
                    {request.status}
                  </td>
                  <td className="px-4 py-4">
                    {new Date(request.created_at).toLocaleString("ar-EG")}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => updateStatus(request.id, "contacted")}
                        className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white"
                      >
                        تم التواصل
                      </button>

                      <button
                        type="button"
                        onClick={() => updateStatus(request.id, "closed")}
                        className="rounded-xl bg-slate-700 px-4 py-2 text-xs font-semibold text-white"
                      >
                        إغلاق
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {requests.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    لا توجد طلبات حالياً
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