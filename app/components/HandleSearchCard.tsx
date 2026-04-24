"use client";

import { useState } from "react";

export default function HandleSearchCard() {
  const [destination, setDestination] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSearch() {
    setSubmitted(true);

    if (!destination.trim()) {
      return;
    }

    // مؤقتًا بدون فتح Google Maps في صفحة جديدة
    // بعد ربط الداتا هنستخدم destination للبحث عن أقرب رحلة
  }

  return (
    <div className="rounded-[32px] bg-white/80 p-6 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
      <h2 className="text-xl font-bold">ابحث عن أقرب رحلة</h2>

      <div className="mt-4 flex flex-col gap-3 md:flex-row">
        <input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="اكتب وجهتك"
          className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none"
        />

        <button
          type="button"
          onClick={handleSearch}
          className="rounded-2xl bg-sky-600 px-6 py-3 font-semibold text-white"
        >
          بحث
        </button>
      </div>

      {submitted && !destination.trim() && (
        <p className="mt-3 text-sm text-red-600">اكتب وجهتك أولًا</p>
      )}
    </div>
  );
}