"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lip/supabase-client";

type Driver = {
  id: number;
  full_name: string;
  phone: string;
  license_number: string | null;
  is_active: boolean;
};

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [message, setMessage] = useState("");

  async function loadDrivers() {
    const { data } = await supabase.from("drivers").select("*").order("id", { ascending: true });
    setDrivers((data as Driver[] | null) ?? []);
  }

  useEffect(() => {
    loadDrivers();
  }, []);

  async function addDriver(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    const { error } = await supabase.from("drivers").insert({
      full_name: fullName,
      phone,
      license_number: licenseNumber,
      is_active: true,
    });

    if (error) {
      setMessage("حصل خطأ أثناء إضافة السواق");
      return;
    }

    setFullName("");
    setPhone("");
    setLicenseNumber("");
    setMessage("تمت إضافة السواق");
    loadDrivers();
  }

  async function toggleDriver(id: number, isActive: boolean) {
    await supabase.from("drivers").update({ is_active: !isActive }).eq("id", id);
    loadDrivers();
  }

  return (
    <main className="min-h-screen bg-[#eef8ff] px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-[32px] bg-white/80 p-8 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <h1 className="text-3xl font-bold">السواقين</h1>
        </div>

        <form onSubmit={addDriver} className="rounded-[32px] bg-white/80 p-6 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur space-y-4">
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="اسم السواق" className="w-full rounded-2xl border border-slate-200 px-4 py-3" required />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="رقم التليفون" className="w-full rounded-2xl border border-slate-200 px-4 py-3" required />
          <input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="رقم الرخصة" className="w-full rounded-2xl border border-slate-200 px-4 py-3" />

          <button className="w-full rounded-2xl bg-sky-600 px-6 py-4 text-white">
            إضافة سواق
          </button>

          <div className="text-center text-sm">{message || "—"}</div>
        </form>

        <div className="rounded-[32px] bg-white/80 p-4 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 text-right text-sm text-slate-500">
                <th className="px-4 py-3">الاسم</th>
                <th className="px-4 py-3">التليفون</th>
                <th className="px-4 py-3">الرخصة</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => (
                <tr key={driver.id} className="border-b border-slate-100 text-sm">
                  <td className="px-4 py-4">{driver.full_name}</td>
                  <td className="px-4 py-4">{driver.phone}</td>
                  <td className="px-4 py-4">{driver.license_number || "—"}</td>
                  <td className="px-4 py-4">{driver.is_active ? "مفعل" : "متوقف"}</td>
                  <td className="px-4 py-4">
                    <button onClick={() => toggleDriver(driver.id, driver.is_active)} className="rounded-xl bg-slate-100 px-4 py-2 text-xs">
                      {driver.is_active ? "إيقاف" : "تفعيل"}
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