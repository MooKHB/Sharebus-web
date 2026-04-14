import Image from "next/image";
import { supabase } from "./lip/supabase";
import Link from "next/link";

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

type TripStop = {
  id: number;
  trip_id: number;
  stop_name: string;
  stop_type: "pickup" | "dropoff" | "both";
  sort_order: number;
  is_active: boolean;
};

export default async function Home() {
  const { data: trips, error } = await supabase
    .from("trips")
    .select("*")
    .eq("is_active", true)
    .order("id", { ascending: true });

  if (error) {
    console.error(error);
  }

  const { data: tripStops, error: tripStopsError } = await supabase
    .from("trip_stops")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (tripStopsError) {
    console.error(tripStopsError);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#eef8ff] text-slate-900">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-120px] top-[-80px] h-[280px] w-[280px] rounded-full bg-sky-300/30 blur-3xl" />
        <div className="absolute right-[-80px] top-[120px] h-[260px] w-[260px] rounded-full bg-cyan-200/40 blur-3xl" />
        <div className="absolute bottom-[-120px] left-1/2 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-sky-400/20 blur-3xl" />
      </div>

      {/* Navbar */}
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-white/80 p-2 shadow-sm ring-1 ring-black/5 backdrop-blur">
            <Image
              src="/logo.png"
              alt="ShareBus Logo"
              width={42}
              height={42}
              className="object-contain"
            />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight">ShareBus</p>
            <p className="text-xs text-slate-500">Smart Daily Transport</p>
          </div>
        </div>

        <nav className="hidden items-center gap-8 md:flex">
          <a href="#" className="text-sm font-medium text-slate-600 transition hover:text-sky-600">
            الرئيسية
          </a>
          <a href="#" className="text-sm font-medium text-slate-600 transition hover:text-sky-600">
            الرحلات
          </a>
          <a href="#" className="text-sm font-medium text-slate-600 transition hover:text-sky-600">
            اشتغل معانا
          </a>
          <a href="#" className="text-sm font-medium text-slate-600 transition hover:text-sky-600">
            تواصل معنا
          </a>
        </nav>

        <div className="hidden md:block">
          <button className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-sky-600">
            تسجيل الدخول
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid min-h-[calc(100vh-88px)] max-w-7xl items-center gap-10 px-6 pb-16 pt-6 lg:grid-cols-2 lg:px-8">
        {/* Left content */}
        <div className="text-center lg:text-right">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-medium text-sky-700 shadow-sm ring-1 ring-sky-100 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-sky-500" />
            تنقل يومي أذكى وأكثر راحة
          </div>

          <h1 className="mb-6 text-5xl font-extrabold leading-[1.1] tracking-tight md:text-6xl lg:text-7xl">
            احجز رحلتك
            <span className="block text-sky-600">بشكل أذكى وأسهل</span>
            <span className="block">مع Share Bus</span>
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-lg leading-8 text-slate-600 lg:mx-0">
            منصة نقل جماعي حديثة تساعدك تختار أقرب نقطة تجمع، تحجز بسرعة،
            وتوصل يوميًا براحة وأمان داخل القاهرة الكبرى.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
            <button className="rounded-2xl bg-sky-600 px-7 py-3.5 text-base font-semibold text-white shadow-xl shadow-sky-500/20 transition hover:-translate-y-0.5 hover:bg-sky-700">
              احجز الآن
            </button>
            <button className="rounded-2xl bg-white/80 px-7 py-3.5 text-base font-semibold text-slate-800 ring-1 ring-slate-200 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white">
              اعرف أكثر
            </button>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 lg:justify-start">
            <div className="rounded-full bg-white/70 px-4 py-2 shadow-sm ring-1 ring-black/5">
              رحلات يومية
            </div>
            <div className="rounded-full bg-white/70 px-4 py-2 shadow-sm ring-1 ring-black/5">
              نقاط تجمع مرنة
            </div>
            <div className="rounded-full bg-white/70 px-4 py-2 shadow-sm ring-1 ring-black/5">
              تجربة أسرع
            </div>
          </div>
        </div>

        {/* Right card */}
        <div className="relative">
          <div className="absolute inset-0 scale-105 rounded-[32px] bg-sky-400/20 blur-2xl" />
          <div className="relative overflow-hidden rounded-[32px] bg-white/80 p-5 shadow-2xl shadow-sky-900/10 ring-1 ring-white/60 backdrop-blur-xl md:p-6">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-sky-50 p-3 ring-1 ring-sky-100">
                  <Image
                    src="/logo.png"
                    alt="ShareBus Logo"
                    width={58}
                    height={58}
                    className="object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold">حجز سريع</h2>
                  <p className="text-sm text-slate-500">ابدأ رحلتك في أقل من دقيقة</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 ring-1 ring-emerald-100">
                متاح الآن
              </span>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <p className="mb-1 text-sm text-slate-500">من</p>
                <p className="font-semibold">مدينة نصر</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <p className="mb-1 text-sm text-slate-500">إلى</p>
                <p className="font-semibold">التجمع الخامس</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                  <p className="mb-1 text-sm text-slate-500">الوقت</p>
                  <p className="font-semibold">08:30 AM</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                  <p className="mb-1 text-sm text-slate-500">السعر</p>
                  <p className="font-semibold">45 EGP</p>
                </div>
              </div>

              <button className="mt-2 w-full rounded-2xl bg-slate-900 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-sky-600">
                تأكيد الحجز
              </button>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-sky-50 p-3 text-center ring-1 ring-sky-100">
                <p className="text-lg font-bold text-sky-700">120+</p>
                <p className="text-xs text-slate-500">رحلة أسبوعيًا</p>
              </div>
              <div className="rounded-2xl bg-sky-50 p-3 text-center ring-1 ring-sky-100">
                <p className="text-lg font-bold text-sky-700">25+</p>
                <p className="text-xs text-slate-500">نقطة تجمع</p>
              </div>
              <div className="rounded-2xl bg-sky-50 p-3 text-center ring-1 ring-sky-100">
                <p className="text-lg font-bold text-sky-700">4.9</p>
                <p className="text-xs text-slate-500">رضا المستخدمين</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
        <div className="mb-12 text-center lg:text-right">
          <p className="mb-3 inline-block rounded-full bg-white/70 px-4 py-2 text-sm font-medium text-sky-700 shadow-sm ring-1 ring-sky-100">
            ازاي تستخدم Share Bus
          </p>

          <h2 className="text-3xl font-bold md:text-4xl">
            3 خطوات بسيطة وتبدأ رحلتك
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-[28px] bg-white/80 p-6 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-xl font-bold text-sky-600">
              1
            </div>
            <h3 className="mb-3 text-xl font-bold">اختار الرحلة</h3>
            <p className="text-sm text-slate-600 leading-7">
              حدد المكان اللي رايح منه والوجهة بسهولة من خلال الرحلات المتاحة.
            </p>
          </div>

          <div className="rounded-[28px] bg-white/80 p-6 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-xl font-bold text-sky-600">
              2
            </div>
            <h3 className="mb-3 text-xl font-bold">اختار نقطة التجمع</h3>
            <p className="text-sm text-slate-600 leading-7">
              اختار أقرب نقطة ليك عشان تبدأ رحلتك بسهولة ومن غير تعب.
            </p>
          </div>

          <div className="rounded-[28px] bg-white/80 p-6 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-xl font-bold text-sky-600">
              3
            </div>
            <h3 className="mb-3 text-xl font-bold">احجز واستمتع</h3>
            <p className="text-sm text-slate-600 leading-7">
              أكد الحجز واستمتع بتجربة تنقل مريحة وآمنة.
            </p>
          </div>
        </div>
      </section>

      {/* Trips section */}
      <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
        <div className="mb-12 flex flex-col gap-4 text-center lg:flex-row lg:items-end lg:justify-between lg:text-right">
          <div>
            <p className="mb-3 inline-block rounded-full bg-white/70 px-4 py-2 text-sm font-medium text-sky-700 shadow-sm ring-1 ring-sky-100">
              رحلات مقترحة
            </p>
            <h2 className="text-3xl font-bold md:text-4xl">
              اختار الرحلة المناسبة ليك
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              مجموعة من الرحلات اليومية المصممة لتناسب تنقلاتك داخل القاهرة الكبرى
              بسهولة ومرونة.
            </p>
          </div>

          <button className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-sky-600">
            عرض كل الرحلات
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {(trips as Trip[] | null)?.map((trip) => {
            const pickupStops = ((tripStops as TripStop[] | null) ?? []).filter(
              (stop) =>
                stop.trip_id === trip.id &&
                (stop.stop_type === "pickup" || stop.stop_type === "both")
            );

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
                  <span className="text-sm text-slate-500">{trip.time_text}</span>
                </div>

<h3 className="mb-3 text-xl font-bold">
  {trip.from_location} ← {trip.to_location}
</h3>
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-slate-600">
                    نقطة الالتقاء
                  </label>
                  <select className="w-full rounded-2xl bg-slate-50 px-4 py-3 text-sm ring-1 ring-slate-100 outline-none">
                    <option value="">اختر نقطة الالتقاء</option>
                    {pickupStops.map((stop) => (
                      <option key={stop.id} value={stop.id}>
                        {stop.stop_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                    <p className="text-xs text-slate-500">السعر</p>
                    <p className="mt-1 font-semibold">{trip.price} EGP</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                    <p className="text-xs text-slate-500">المدة</p>
                    <p className="mt-1 font-semibold">{trip.duration_text}</p>
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
      </section>

      {/* Footer */}
      <footer className="mx-auto max-w-7xl px-6 pb-10 lg:px-8">
        <div className="rounded-[32px] bg-white/80 p-8 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-2xl bg-sky-50 p-2">
                  <img src="/logo.png" className="h-10 w-10 object-contain" />
                </div>
                <span className="text-lg font-bold">ShareBus</span>
              </div>

              <p className="text-sm leading-7 text-slate-600">
                منصة نقل جماعي ذكية تساعدك على التنقل اليومي بسهولة وراحة داخل
                القاهرة الكبرى.
              </p>
            </div>

            <div>
              <h3 className="mb-4 font-semibold">روابط سريعة</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="hover:text-sky-600 cursor-pointer">الرئيسية</li>
                <li className="hover:text-sky-600 cursor-pointer">الرحلات</li>
                <li className="hover:text-sky-600 cursor-pointer">اشتغل معانا</li>
                <li className="hover:text-sky-600 cursor-pointer">تواصل معنا</li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-semibold">تواصل معنا</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>📧 support@sharebus.com</li>
                <li>📞 +201552168353</li>
                <li>📍 6th Of October, Giza, Egypt</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t pt-6 text-center text-sm text-slate-500">
            © 2026 ShareBus. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}