import { supabase } from "../../lip/supabase";

type TripAgg = {
  trip_id: number;
  count: number;
};

export default async function ReportsPage() {
  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      id,
      status,
      seats,
      booking_type,
      payment_method,
      trip_id,
      trips:trip_id (
        from_location,
        to_location,
        price,
        weekly_price,
        monthly_price
      )
    `);

  const safeBookings = bookings ?? [];

  const totalBookings = safeBookings.length;
  const confirmedBookings = safeBookings.filter((b: any) => b.status === "confirmed").length;
  const cancelledBookings = safeBookings.filter((b: any) => b.status === "cancelled").length;

  const cashCount = safeBookings.filter((b: any) => b.payment_method === "cash").length;
  const instapayCount = safeBookings.filter((b: any) => b.payment_method === "instapay").length;

  const revenue = safeBookings
    .filter((b: any) => b.status !== "cancelled")
    .reduce((sum: number, b: any) => {
      const seats = Number(b.seats || 1);
      const trip = b.trips;
      if (!trip) return sum;

      const basePrice = Number(trip.price || 0);

      if (b.booking_type === "weekly") {
        return sum + Number(trip.weekly_price ?? basePrice * 5) * seats;
      }

      if (b.booking_type === "monthly") {
        return sum + Number(trip.monthly_price ?? basePrice * 22) * seats;
      }

      if (b.booking_type === "round_trip") {
        return sum + basePrice * 2 * seats;
      }

      return sum + basePrice * seats;
    }, 0);

  const tripMap = new Map<number, { label: string; count: number }>();

  safeBookings.forEach((b: any) => {
    if (!b.trip_id || !b.trips) return;
    const label = `${b.trips.from_location} ← ${b.trips.to_location}`;
    const current = tripMap.get(b.trip_id) || { label, count: 0 };
    current.count += 1;
    tripMap.set(b.trip_id, current);
  });

  const tripStats = Array.from(tripMap.entries())
    .map(([tripId, value]) => ({
      tripId,
      ...value,
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <main className="min-h-screen bg-[#eef8ff] px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[32px] bg-white/80 p-8 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <h1 className="text-3xl font-bold">التقارير</h1>
          <p className="mt-2 text-sm text-slate-500">
            نظرة سريعة على الأداء والحجوزات والمدفوعات.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Metric title="إجمالي الحجوزات" value={String(totalBookings)} />
          <Metric title="الحجوزات المؤكدة" value={String(confirmedBookings)} />
          <Metric title="الحجوزات الملغية" value={String(cancelledBookings)} />
          <Metric title="Cash" value={String(cashCount)} />
          <Metric title="Instapay" value={String(instapayCount)} />
        </div>

        <div className="rounded-[32px] bg-white/80 p-8 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <p className="text-sm text-slate-500">إجمالي المبالغ المحجوزة</p>
          <p className="mt-2 text-4xl font-bold text-sky-700">{revenue} EGP</p>
          <p className="mt-2 text-xs text-slate-400">
            ده إجمالي قيمة الحجوزات غير الملغية، وليس بالضرورة المحصّل فعليًا.
          </p>
        </div>

        <div className="rounded-[32px] bg-white/80 p-4 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <h2 className="mb-4 px-4 text-xl font-bold">أكثر الرحلات حجزًا</h2>

          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 text-right text-sm text-slate-500">
                <th className="px-4 py-3">الرحلة</th>
                <th className="px-4 py-3">عدد الحجوزات</th>
              </tr>
            </thead>
            <tbody>
              {tripStats.map((trip) => (
                <tr key={trip.tripId} className="border-b border-slate-100 text-sm">
                  <td className="px-4 py-4">{trip.label}</td>
                  <td className="px-4 py-4 font-semibold">{trip.count}</td>
                </tr>
              ))}

              {tripStats.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-slate-500">
                    لا توجد بيانات كافية بعد
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

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[28px] bg-white/80 p-6 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}