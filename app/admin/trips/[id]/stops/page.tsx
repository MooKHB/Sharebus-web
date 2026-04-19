"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lip/supabase-client";

type Stop = {
  id: number;
  stop_name: string;
  stop_type: "pickup" | "dropoff" | "both";
  sort_order: number;
  is_active: boolean;
  latitude: number | null;
  longitude: number | null;
};

export default function TripStopsPage({
  params,
}: {
  params: { id: string };
}) {
  const tripId = Number(params.id);

  const [stops, setStops] = useState<Stop[]>([]);
  const [stopName, setStopName] = useState("");
  const [stopType, setStopType] = useState<"pickup" | "dropoff" | "both">("pickup");
  const [sortOrder, setSortOrder] = useState("1");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [message, setMessage] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<"pickup" | "dropoff" | "both">("pickup");
  const [editOrder, setEditOrder] = useState("1");
  const [editLatitude, setEditLatitude] = useState("");
  const [editLongitude, setEditLongitude] = useState("");

  async function loadStops() {
    const { data } = await supabase
      .from("trip_stops")
      .select("*")
      .eq("trip_id", tripId)
      .order("sort_order", { ascending: true });

    setStops((data as Stop[] | null) ?? []);
  }

  useEffect(() => {
    loadStops();
  }, [tripId]);

  async function addStop(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    const { error } = await supabase.from("trip_stops").insert({
      trip_id: tripId,
      stop_name: stopName,
      stop_type: stopType,
      sort_order: Number(sortOrder),
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      is_active: true,
    });

    if (error) {
      setMessage("حصل خطأ أثناء إضافة نقطة الالتقاء");
      return;
    }

    setStopName("");
    setSortOrder("1");
    setLatitude("");
    setLongitude("");
    setMessage("تمت إضافة نقطة الالتقاء");
    loadStops();
  }

  async function toggleStop(id: number, isActive: boolean) {
    await supabase.from("trip_stops").update({ is_active: !isActive }).eq("id", id);
    loadStops();
  }

  function startEdit(stop: Stop) {
    setEditingId(stop.id);
    setEditName(stop.stop_name);
    setEditType(stop.stop_type);
    setEditOrder(String(stop.sort_order));
    setEditLatitude(stop.latitude !== null ? String(stop.latitude) : "");
    setEditLongitude(stop.longitude !== null ? String(stop.longitude) : "");
  }

  async function saveEdit() {
    if (!editingId) return;

    await supabase
      .from("trip_stops")
      .update({
        stop_name: editName,
        stop_type: editType,
        sort_order: Number(editOrder),
        latitude: editLatitude ? Number(editLatitude) : null,
        longitude: editLongitude ? Number(editLongitude) : null,
      })
      .eq("id", editingId);

    setEditingId(null);
    loadStops();
  }

  async function deleteStop(id: number) {
    const confirmed = window.confirm("هل تريد حذف نقطة الالتقاء؟");
    if (!confirmed) return;

    await supabase.from("trip_stops").delete().eq("id", id);
    loadStops();
  }

  return (
    <main className="min-h-screen bg-[#eef8ff] px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[32px] bg-white/80 p-8 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <h1 className="text-3xl font-bold">نقاط الالتقاء</h1>
        </div>

        <form onSubmit={addStop} className="rounded-[32px] bg-white/80 p-6 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur space-y-4">
          <input value={stopName} onChange={(e) => setStopName(e.target.value)} placeholder="اسم نقطة الالتقاء" className="w-full rounded-2xl border border-slate-200 px-4 py-3" required />

          <select value={stopType} onChange={(e) => setStopType(e.target.value as "pickup" | "dropoff" | "both")} className="w-full rounded-2xl border border-slate-200 px-4 py-3">
            <option value="pickup">Pickup</option>
            <option value="dropoff">Dropoff</option>
            <option value="both">Both</option>
          </select>

          <input value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} placeholder="الترتيب" type="number" className="w-full rounded-2xl border border-slate-200 px-4 py-3" required />

          <div className="grid gap-4 md:grid-cols-2">
            <input value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="Latitude" type="number" step="any" className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
            <input value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="Longitude" type="number" step="any" className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
          </div>

          <button className="w-full rounded-2xl bg-sky-600 px-6 py-4 text-white">
            إضافة نقطة
          </button>

          <div className="text-center text-sm">{message || "—"}</div>
        </form>

        <div className="overflow-x-auto rounded-[32px] bg-white/80 p-4 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <table className="w-full min-w-[1200px]">
            <thead>
              <tr className="border-b border-slate-100 text-right text-sm text-slate-500">
                <th className="px-4 py-3">الاسم</th>
                <th className="px-4 py-3">النوع</th>
                <th className="px-4 py-3">الترتيب</th>
                <th className="px-4 py-3">Lat</th>
                <th className="px-4 py-3">Lng</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {stops.map((stop) => (
                <tr key={stop.id} className="border-b border-slate-100 text-sm">
                  <td className="px-4 py-4">
                    {editingId === stop.id ? (
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
                    ) : (
                      stop.stop_name
                    )}
                  </td>

                  <td className="px-4 py-4">
                    {editingId === stop.id ? (
                      <select value={editType} onChange={(e) => setEditType(e.target.value as "pickup" | "dropoff" | "both")} className="w-full rounded-xl border border-slate-200 px-3 py-2">
                        <option value="pickup">Pickup</option>
                        <option value="dropoff">Dropoff</option>
                        <option value="both">Both</option>
                      </select>
                    ) : (
                      stop.stop_type
                    )}
                  </td>

                  <td className="px-4 py-4">
                    {editingId === stop.id ? (
                      <input value={editOrder} onChange={(e) => setEditOrder(e.target.value)} type="number" className="w-full rounded-xl border border-slate-200 px-3 py-2" />
                    ) : (
                      stop.sort_order
                    )}
                  </td>

                  <td className="px-4 py-4">
                    {editingId === stop.id ? (
                      <input value={editLatitude} onChange={(e) => setEditLatitude(e.target.value)} type="number" step="any" className="w-full rounded-xl border border-slate-200 px-3 py-2" />
                    ) : (
                      stop.latitude ?? "—"
                    )}
                  </td>

                  <td className="px-4 py-4">
                    {editingId === stop.id ? (
                      <input value={editLongitude} onChange={(e) => setEditLongitude(e.target.value)} type="number" step="any" className="w-full rounded-xl border border-slate-200 px-3 py-2" />
                    ) : (
                      stop.longitude ?? "—"
                    )}
                  </td>

                  <td className="px-4 py-4">{stop.is_active ? "مفعلة" : "متوقفة"}</td>

                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {editingId === stop.id ? (
                        <>
                          <button onClick={saveEdit} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs text-white">
                            حفظ
                          </button>
                          <button onClick={() => setEditingId(null)} className="rounded-xl bg-slate-100 px-4 py-2 text-xs">
                            إلغاء
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(stop)} className="rounded-xl bg-slate-100 px-4 py-2 text-xs">
                            تعديل
                          </button>
                          <button onClick={() => toggleStop(stop.id, stop.is_active)} className="rounded-xl bg-amber-500 px-4 py-2 text-xs text-white">
                            {stop.is_active ? "إيقاف" : "تفعيل"}
                          </button>
                          <button onClick={() => deleteStop(stop.id)} className="rounded-xl bg-red-600 px-4 py-2 text-xs text-white">
                            حذف
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {stops.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    لا توجد نقاط التقاء
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