"use client";

import { useState } from "react";
import { supabase } from "../../../lip/supabase-client";

export default function NewVehiclePage() {
  const [name, setName] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [seatsCount, setSeatsCount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const seats = seatsCount.trim() === "" ? null : Number(seatsCount);

    if (seatsCount.trim() !== "" && Number.isNaN(seats)) {
      setMessage("عدد الكراسي غير صحيح");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("vehicles").insert({
      name: name.trim(),
      plate_number: plateNumber.trim() || null,
      seats_count: seats,
      is_active: true,
    });

    if (error) {
      setMessage(`حصل خطأ أثناء إضافة العربية: ${error.message}`);
      setLoading(false);
      return;
    }

    setMessage("تمت إضافة العربية بنجاح");
    setName("");
    setPlateNumber("");
    setSeatsCount("");
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#eef8ff] px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-3xl rounded-[32px] bg-white/80 p-8 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
        <h1 className="mb-6 text-3xl font-bold">إضافة عربية</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اسم العربية"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            required
          />

          <input
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value)}
            placeholder="رقم اللوحة"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
          />

          <input
            value={seatsCount}
            onChange={(e) => setSeatsCount(e.target.value)}
            placeholder="عدد الكراسي"
            type="number"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-sky-600 px-6 py-4 text-white"
          >
            {loading ? "جاري الحفظ..." : "إضافة العربية"}
          </button>
        </form>

        <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-center text-sm ring-1 ring-slate-100">
          {message || "—"}
        </div>
      </div>
    </main>
  );
}