"use client";

import { useState } from "react";
import { supabase } from "../../../lip/supabase-client";

export default function NewDriverPage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.from("drivers").insert({
      full_name: fullName.trim(),
      phone: phone.trim() || null,
      national_id: nationalId.trim() || null,
      is_active: true,
    });

    if (error) {
      setMessage(`حصل خطأ أثناء إضافة السواق: ${error.message}`);
      setLoading(false);
      return;
    }

    setMessage("تمت إضافة السواق بنجاح");
    setFullName("");
    setPhone("");
    setNationalId("");
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#eef8ff] px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-3xl rounded-[32px] bg-white/80 p-8 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
        <h1 className="mb-6 text-3xl font-bold">إضافة سواق</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="اسم السواق"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            required
          />

          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="رقم الهاتف"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
          />

          <input
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
            placeholder="الرقم القومي"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-sky-600 px-6 py-4 text-white"
          >
            {loading ? "جاري الحفظ..." : "إضافة السواق"}
          </button>
        </form>

        <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-center text-sm ring-1 ring-slate-100">
          {message || "—"}
        </div>
      </div>
    </main>
  );
}