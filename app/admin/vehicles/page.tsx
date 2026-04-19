"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lip/supabase-client";

type Vehicle = {
  id: number;
  name: string;
  plate_number: string;
  seats_count: number;
  color: string | null;
  is_active: boolean;
};

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [name, setName] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [seatsCount, setSeatsCount] = useState("14");
  const [color, setColor] = useState("");
  const [message, setMessage] = useState("");

  async function loadVehicles() {
    const { data } = await supabase.from("vehicles").select("*").order("id", { ascending: true });
    setVehicles((data as Vehicle[] | null) ?? []);
  }

  useEffect(() => {
    loadVehicles();
  }, []);

  async function addVehicle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    const { error } = await supabase.from("vehicles").insert({
      name,
      plate_number: plateNumber,
      seats_count: Number(seatsCount),
      color,
      is_active: true,
    });

    if (error) {
      setMessage("حصل خطأ أثناء إضافة العربية");
      return;
    }

    setName("");
    setPlateNumber("");
    setSeatsCount("14");
    setColor("");
    setMessage("تمت إضافة العربية");
    loadVehicles();
  }

  async function toggleVehicle(id: number, isActive: boolean) {
    await supabase.from("vehicles").update({ is_active: !isActive }).eq("id", id);
    loadVehicles();
  }

  return (
    <main className="min-h-screen bg-[#eef8ff] px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-[32px] bg-white/80 p-8 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <h1 className="text-3xl font-bold">العربيات</h1>
        </div>

        <form onSubmit={addVehicle} className="rounded-[32px] bg-white/80 p-6 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur space-y-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم العربية" className="w-full rounded-2xl border border-slate-200 px-4 py-3" required />
          <input value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} placeholder="رقم اللوحة" className="w-full rounded-2xl border border-slate-200 px-4 py-3" required />
          <input value={seatsCount} onChange={(e) => setSeatsCount(e.target.value)} placeholder="عدد الكراسي" type="number" className="w-full rounded-2xl border border-slate-200 px-4 py-3" required />
          <input value={color} onChange={(e) => setColor(e.target.value)} placeholder="اللون" className="w-full rounded-2xl border border-slate-200 px-4 py-3" />

          <button className="w-full rounded-2xl bg-sky-600 px-6 py-4 text-white">
            إضافة عربية
          </button>

          <div className="text-center text-sm">{message || "—"}</div>
        </form>

        <div className="rounded-[32px] bg-white/80 p-4 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 text-right text-sm text-slate-500">
                <th className="px-4 py-3">الاسم</th>
                <th className="px-4 py-3">اللوحة</th>
                <th className="px-4 py-3">الكراسي</th>
                <th className="px-4 py-3">اللون</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="border-b border-slate-100 text-sm">
                  <td className="px-4 py-4">{vehicle.name}</td>
                  <td className="px-4 py-4">{vehicle.plate_number}</td>
                  <td className="px-4 py-4">{vehicle.seats_count}</td>
                  <td className="px-4 py-4">{vehicle.color || "—"}</td>
                  <td className="px-4 py-4">{vehicle.is_active ? "مفعلة" : "متوقفة"}</td>
                  <td className="px-4 py-4">
                    <button onClick={() => toggleVehicle(vehicle.id, vehicle.is_active)} className="rounded-xl bg-slate-100 px-4 py-2 text-xs">
                      {vehicle.is_active ? "إيقاف" : "تفعيل"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}