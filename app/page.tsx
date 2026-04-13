import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-black">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 text-center">

        <Image
          src="/logo.png"
          alt="ShareBus Logo"
          width={120}
          height={120}
          className="mb-6"
        />

        <span className="mb-4 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium">
          Welcome to ShareBus
        </span>

        <h1 className="mb-6 text-4xl font-bold leading-tight md:text-6xl">
          تنقل أسهل وأذكى مع
          <span className="block">ShareBus</span>
        </h1>

        <p className="mb-8 max-w-2xl text-lg leading-8 text-gray-600 md:text-xl">
          منصة نقل جماعي تساعدك تحجز رحلتك بسهولة، تختار أنسب نقطة تجمع،
          وتوصل براحة وأمان.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <button className="rounded-xl bg-black px-6 py-3 text-white">
            احجز الآن
          </button>
          <button className="rounded-xl border border-black px-6 py-3">
            اعرف أكثر
          </button>
        </div>
      </section>
    </main>
  );
}