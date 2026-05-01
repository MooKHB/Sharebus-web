import Link from "next/link";
import { supabase } from "../lip/supabase";
import { Route } from "lucide-react";
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  is_active: boolean;
};

export default async function TripsPage() {
  const { data: trips, error } = await supabase
    .from("trips")
    .select("*")
    .eq("is_active", true)
    .order("id", { ascending: true });

  if (error) {
    console.error(error);
  }

  const allTrips = (trips as Trip[] | null) ?? [];

  return (
    <main className="min-h-screen bg-[#eef8ff] px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 rounded-[32px] bg-white/80 p-8 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <p className="mb-3 inline-block rounded-full bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 ring-1 ring-sky-100">
            كل الرحلات
          </p>
          <h1 className="text-3xl font-bold md:text-4xl">
            الرحلات المتاحة
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
            اختر الرحلة المناسبة ليك من كل الرحلات المتاحة حاليًا داخل القاهرة الكبرى.
          </p>
        </div>

        {allTrips.length === 0 ? (
          <div className="rounded-[32px] bg-white/80 p-8 text-center shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
            <h2 className="text-2xl font-bold">لا توجد رحلات متاحة حاليًا</h2>
            <p className="mt-3 text-slate-500">
              لو رحلتك مش موجودة ابعت لنا طلب وسنتواصل معك.
            </p>

            <Link
              href="/request-ride"
              className="mt-6 inline-block rounded-2xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-700"
            >
              Request Ride
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8 text-left">
              <Link
                href="/request-ride"
                className="inline-block rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 ring-1 ring-slate-200 transition hover:bg-slate-50"
              >
                Request Ride
              </Link>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {allTrips.map((trip) => {
                const badgeStyles =
                  trip.badge_color === "emerald"
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                    : trip.badge_color === "violet"
                    ? "bg-violet-50 text-violet-700 ring-violet-100"
                    : "bg-sky-50 text-sky-700 ring-sky-100";

                return (
                  <div
                    key={trip.id}
                    className="rounded-[28px] bg-white/80 p-6 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur"
                  >
                    <div className="mb-5 flex items-center justify-between">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${badgeStyles}`}
                      >
                        {trip.badge}
                      </span>
                      <span className="text-sm text-slate-500">
                        {trip.time_text}
                      </span>
                    </div>

                    <div className="mb-3 flex items-center gap-2 text-sky-700">
                      <Route size={18} />
                      <span className="text-sm font-medium">خط الرحلة</span>
                    </div>

                    <h3 className="mb-3 text-xl font-bold">
                      {trip.from_location} ← {trip.to_location}
                    </h3>

                    <p className="mb-4 text-sm leading-7 text-slate-600">
                      {trip.description}
                    </p>

                    <div className="mb-5 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                        <p className="text-xs text-slate-500">السعر</p>
                        <p className="mt-1 font-semibold">{trip.price} EGP</p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                        <p className="text-xs text-slate-500">المدة</p>
                        <p className="mt-1 font-semibold">
                          {trip.duration_text}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/book/${trip.id}`}
                      className="block w-full rounded-2xl bg-sky-600 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-sky-700"
                    >
                      احجز هذه الرحلة
                    </Link>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}