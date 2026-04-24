"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../lip/supabase-client";

type Schedule = {
  id: number;
  time_text: string;
  is_active: boolean;
};

export default function TripSchedulesPage() {
  const params = useParams();
  const tripId = useMemo(() => Number(params?.id), [params]);

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [timeText, setTimeText] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTimeText, setEditTimeText] = useState("");

  async function loadSchedules() {
    if (!tripId || Number.isNaN(tripId)) return;

    const { data, error } = await supabase
      .from("trip_schedules")
      .select("*")
      .eq("trip_id", tripId)
      .order("id", { ascending: true });

    if (error) {
      console.error(error);
      setMessage(`حصل خطأ أثناء تحميل المواعيد: ${error.message}`);
      return;
    }

    setSchedules((data as Schedule[] | null) ?? []);
  }

  useEffect(() => {
    if (!tripId || Number.isNaN(tripId)) return;
    loadSchedules();
  }, [tripId]);

  async function addSchedule(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (!tripId || Number.isNaN(tripId)) {
      setMessage("رقم الرحلة غير صحيح");
      return;
    }

    if (!timeText.trim()) {
      setMessage("المعاد مطلوب");
      return;
    }

    const { error } = await supabase.from("trip_schedules").insert({
      trip_id: tripId,
      time_text: timeText.trim(),
      is_active: true,
    });

    if (error) {
      setMessage(`حصل خطأ أثناء إضافة المعاد: ${error.message}`);
      return;
    }

    setTimeText("");
    setMessage("تمت إضافة المعاد");
    loadSchedules();
  }

  async function toggleSchedule(id: number, isActive: boolean) {
    const { error } = await supabase
      .from("trip_schedules")
      .update({ is_active: !isActive })
      .eq("id", id);

    if (error) {
      setMessage(`حصل خطأ أثناء تحديث الحالة: ${error.message}`);
      return;
    }

    loadSchedules();
  }

  function startEdit(schedule: Schedule) {
    setEditingId(schedule.id);
    setEditTimeText(schedule.time_text);
  }

  async function saveEdit() {
    if (!editingId) return;

    if (!editTimeText.trim()) {
      setMessage("المعاد مطلوب");
      return;
    }

    const { error } = await supabase
      .from("trip_schedules")
      .update({ time_text: editTimeText.trim() })
      .eq("id", editingId);

    if (error) {
      setMessage(`حصل خطأ أثناء حفظ التعديل: ${error.message}`);
      return;
    }

    setEditingId(null);
    setMessage("تم تعديل المعاد");
    loadSchedules();
  }

  async function deleteSchedule(id: number) {
    const confirmed = window.confirm("هل تريد حذف المعاد؟");
    if (!confirmed) return;

    const { error } = await supabase.from("trip_schedules").delete().eq("id", id);

    if (error) {
      setMessage(`حصل خطأ أثناء حذف المعاد: ${error.message}`);
      return;
    }

    setMessage("تم حذف المعاد");
    loadSchedules();
  }

  return (
    <main className="min-h-screen bg-[#eef8ff] px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-[32px] bg-white/80 p-8 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <h1 className="text-3xl font-bold">المواعيد</h1>
        </div>

        <form onSubmit={addSchedule} className="space-y-4 rounded-[32px] bg-white/80 p-6 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <input
            value={timeText}
            onChange={(e) => setTimeText(e.target.value)}
            placeholder="مثال: 08:30 AM"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            required
          />

          <button className="w-full rounded-2xl bg-sky-600 px-6 py-4 text-white">
            إضافة معاد
          </button>

          <div className="text-center text-sm whitespace-pre-line">{message || "—"}</div>
        </form>

        <div className="rounded-[32px] bg-white/80 p-4 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100 text-right text-sm text-slate-500">
                <th className="px-4 py-3">المعاد</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((schedule) => (
                <tr key={schedule.id} className="border-b border-slate-100 text-sm">
                  <td className="px-4 py-4">
                    {editingId === schedule.id ? (
                      <input
                        value={editTimeText}
                        onChange={(e) => setEditTimeText(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2"
                      />
                    ) : (
                      schedule.time_text
                    )}
                  </td>
                  <td className="px-4 py-4">{schedule.is_active ? "مفعل" : "متوقف"}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {editingId === schedule.id ? (
                        <>
                          <button type="button" onClick={saveEdit} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs text-white">
                            حفظ
                          </button>
                          <button type="button" onClick={() => setEditingId(null)} className="rounded-xl bg-slate-100 px-4 py-2 text-xs">
                            إلغاء
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => startEdit(schedule)} className="rounded-xl bg-slate-100 px-4 py-2 text-xs">
                            تعديل
                          </button>
                          <button type="button" onClick={() => toggleSchedule(schedule.id, schedule.is_active)} className="rounded-xl bg-amber-500 px-4 py-2 text-xs text-white">
                            {schedule.is_active ? "إيقاف" : "تفعيل"}
                          </button>
                          <button type="button" onClick={() => deleteSchedule(schedule.id)} className="rounded-xl bg-red-600 px-4 py-2 text-xs text-white">
                            حذف
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {schedules.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                    لا توجد مواعيد
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