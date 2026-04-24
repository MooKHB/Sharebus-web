import Link from "next/link";
import { supabase } from "../lip/supabase";

export default async function AdminPage() {
  const { count: tripsCount } = await supabase
    .from("trips")
    .select("*", { count: "exact", head: true });

  const { count: bookingsCount } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true });

  const { count: requestsCount } = await supabase
    .from("ride_requests")
    .select("*", { count: "exact", head: true });

  const { count: driversCount } = await supabase
    .from("drivers")
    .select("*", { count: "exact", head: true });

  const { count: vehiclesCount } = await supabase
    .from("vehicles")
    .select("*", { count: "exact", head: true });

  const { count: ridersCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const { count: subscriptionsCount } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true });

  return (
    <main className="min-h-screen bg-[#eef8ff] px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[32px] bg-white/80 p-8 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <p className="mb-3 inline-block rounded-full bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 ring-1 ring-sky-100">
            لوحة التحكم
          </p>
          <h1 className="text-3xl font-bold md:text-4xl">Admin Dashboard</h1>
          <p className="mt-3 text-sm text-slate-500">
            تحكم كامل في الرحلات، العملاء، العربيات، السواقين، الحجوزات والاشتراكات.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-7">
          <Card title="الرحلات" value={tripsCount ?? 0} color="text-sky-700" />
          <Card title="الحجوزات" value={bookingsCount ?? 0} color="text-emerald-700" />
          <Card title="طلبات الرحلات" value={requestsCount ?? 0} color="text-amber-700" />
          <Card title="السواقين" value={driversCount ?? 0} color="text-violet-700" />
          <Card title="العربيات" value={vehiclesCount ?? 0} color="text-rose-700" />
          <Card title="العملاء" value={ridersCount ?? 0} color="text-slate-700" />
          <Card title="الاشتراكات" value={subscriptionsCount ?? 0} color="text-cyan-700" />
          
        </div>

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-7">
          <QuickLink href="/admin/trips" label="إدارة الرحلات" primary />
          <QuickLink href="/admin/bookings" label="إدارة الحجوزات" />
          <QuickLink href="/admin/riders" label="Users / Riders" />
          <QuickLink href="/admin/drivers" label="السواقين" />
          <QuickLink href="/admin/vehicles" label="العربيات" />
          <QuickLink href="/admin/subscriptions" label="الاشتراكات" />
          <QuickLink href="/admin/reports" label="التقارير" />
          <QuickLink href="/admin/ride-requests" label="طلبات الرحلات" />
        </div>
      </div>
    </main>
  );
}

function Card({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-[28px] bg-white/80 p-6 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
      <p className="text-sm text-slate-500">{title}</p>
      <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function QuickLink({
  href,
  label,
  primary = false,
}: {
  href: string;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-[28px] px-6 py-5 text-center text-base font-semibold transition ${
        primary
          ? "bg-sky-600 text-white shadow-lg shadow-sky-500/20 hover:bg-sky-700"
          : "bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50"
      }`}
    >
      {label}
    </Link>
  );
}