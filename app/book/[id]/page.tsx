import { supabase } from "../../lip/supabase";
import BookingForm from "./BookingForm";
import Toast from "@/app/components/Toast";

type Trip = {
  id: number;
  from_location: string;
  to_location: string;
  price: number;
  duration_text: string;
  allow_weekly_subscription: boolean;
  allow_monthly_subscription: boolean;
  weekly_price: number | null;
  monthly_price: number | null;
  reverse_trip_id: number | null;
  supports_round_trip: boolean;
  available_days: string[] | null;
  payment_methods: string[] | null;
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

export default async function TripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tripId = Number(id);

  const { data: trip, error: tripError } = await supabase
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

  const { data: pickupStops } = await supabase
    .from("trip_stops")
    .select("*")
    .eq("trip_id", tripId)
    .eq("is_active", true)
    .in("stop_type", ["pickup", "both"])
    .order("sort_order", { ascending: true });

  const { data: dropoffStops } = await supabase
    .from("trip_stops")
    .select("*")
    .eq("trip_id", tripId)
    .eq("is_active", true)
    .in("stop_type", ["dropoff", "both"])
    .order("sort_order", { ascending: true });

  if (!trip) {
    return (
      <main className="min-h-screen bg-[#eef8ff] px-6 py-12 text-slate-900">
        <div className="mx-auto max-w-4xl rounded-[32px] bg-white/80 p-8 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <h1 className="text-2xl font-bold text-red-500">الرحلة غير موجودة</h1>
          <p className="mt-3 text-sm text-slate-500">
            {tripError?.message || "الرحلة غير متاحة"}
          </p>
        </div>
      </main>
    );
  }

  const tripData = trip as Trip;

  return (
    <main className="min-h-screen bg-[#eef8ff] px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-[32px] bg-white/80 p-8 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <h1 className="mb-4 text-3xl font-bold md:text-4xl">
            {tripData.from_location} ← {tripData.to_location}
          </h1>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
              <p className="text-sm text-slate-500">السعر الأساسي</p>
              <p className="mt-1 text-lg font-bold">{Number(tripData.price)} EGP</p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
              <p className="text-sm text-slate-500">المدة</p>
              <p className="mt-1 text-lg font-bold">{tripData.duration_text}</p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
              <p className="text-sm text-slate-500">عدد المواعيد</p>
              <p className="mt-1 text-lg font-bold">{schedules?.length || 0}</p>
            </div>
          </div>
        </div>

        <BookingForm
          tripId={tripData.id}
          schedules={(schedules as TripSchedule[] | null) ?? []}
          pickupStops={(pickupStops as TripStop[] | null) ?? []}
          dropoffStops={(dropoffStops as TripStop[] | null) ?? []}
          price={Number(tripData.price)}
          allowWeeklySubscription={Boolean(tripData.allow_weekly_subscription)}
          allowMonthlySubscription={Boolean(tripData.allow_monthly_subscription)}
          weeklyPrice={tripData.weekly_price !== null ? Number(tripData.weekly_price) : null}
          monthlyPrice={tripData.monthly_price !== null ? Number(tripData.monthly_price) : null}
          reverseTripId={tripData.reverse_trip_id ?? null}
          supportsRoundTrip={Boolean(tripData.supports_round_trip)}
          availableDays={tripData.available_days ?? []}
          tripPaymentMethods={tripData.payment_methods ?? ["cash", "instapay"]}
        />
      </div>
    </main>
  );
}