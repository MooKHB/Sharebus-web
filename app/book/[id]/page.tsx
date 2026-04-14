import { supabase } from "../../lip/supabase";

type Trip = {
  id: number;
  badge: string;
  badge_color: string;
  from_location: string;
  to_location: string;
  time_text: string;
  price: number;
  duration_text: string;
  description: string;
};

type TripSchedule = {
  id: number;
  trip_id: number;
  time_text: string;
  is_active: boolean;
};

type TripStop = {
  id: number;
  trip_id: number;
  stop_name: string;
  stop_type: "pickup" | "dropoff" | "both";
  sort_order: number;
  is_active: boolean;
};

export default async function BookTripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tripId = Number(id);

  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .single();

  const { data: schedules } = await supabase
    .from("trip_schedules")
    .select("*")
    .eq("trip_id", tripId)
    .eq("is_active", true)
    .order("id", { ascending: true });

  const { data: stops } = await supabase
    .from("trip_stops")
    .select("*")
    .eq("trip_id", tripId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const pickupStops =
    (stops as TripStop[] | null)?.filter(
      (stop) => stop.stop_type === "pickup" || stop.stop_type === "both"
    ) ?? [];

  const dropoffStops =
    (stops as TripStop[] | null)?.filter(
      (stop) => stop.stop_type === "dropoff" || stop.stop_type === "both"
    ) ?? [];

  if (!trip) {
    return (
      <main className="min-h-screen bg-[#eef8ff] px-6 py-16 text-center text-slate-900">
        <h1 className="text-2xl font-bold">الرحلة غير موجودة</h1>
      </main>
    );
  }

  const tripData = trip as Trip;

  return (
    <main className="min-h-screen bg-[#eef8ff] px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 rounded-[32px] bg-white/80 p-8 shadow-xl ring-1 ring-white/70 backdrop-blur">
          <h1 className="mb-3 text-3xl font-bold">
            احجز رحلتك: {tripData.from_location} ← {tripData.to_location}
          </h1>

          <p className="text-slate-600">{tripData.description}</p>

          {/* نقطة الالتقاء تحت اسم الخط */}
          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium">
              اختر نقطة الالتقاء
            </label>

            <select className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none">
              <option value="">اختر نقطة الالتقاء</option>

              {pickupStops.map((stop) => (
                <option key={stop.id} value={stop.id}>
                  {stop.stop_name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">السعر</p>
              <p className="font-semibold">{tripData.price} EGP</p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">المدة</p>
              <p className="font-semibold">{tripData.duration_text}</p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">الرحلة الأساسية</p>
              <p className="font-semibold">{tripData.time_text}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] bg-white/80 p-8 shadow-xl ring-1 ring-white/70 backdrop-blur">
          <h2 className="mb-6 text-2xl font-bold">اختر تفاصيل الحجز</h2>

          <form className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium">
                اختر المعاد
              </label>
              <select className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none">
                <option value="">اختر المعاد</option>

                {(schedules as TripSchedule[] | null)?.map((schedule) => (
                  <option key={schedule.id} value={schedule.id}>
                    {schedule.time_text}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                مكان الركوب
              </label>
              <select className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none">
                <option value="">اختر مكان الركوب</option>

                {pickupStops.map((stop) => (
                  <option key={stop.id} value={stop.id}>
                    {stop.stop_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                مكان النزول
              </label>
              <select className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none">
                <option value="">اختر مكان النزول</option>

                {dropoffStops.map((stop) => (
                  <option key={stop.id} value={stop.id}>
                    {stop.stop_name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="w-full rounded-2xl bg-sky-600 px-6 py-4 text-base font-semibold text-white transition hover:bg-sky-700"
            >
              متابعة الحجز
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}