"use client";

type Props = {
  currentLang: "ar" | "en";
};

export default function LanguageSwitcher({ currentLang }: Props) {
  function setLang(lang: "ar" | "en") {
    document.cookie = `site_lang=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    window.location.reload();
  }

  return (
    <div className="flex items-center gap-2 rounded-full bg-white/80 px-2 py-2 shadow-sm ring-1 ring-black/5 backdrop-blur">
      <button
        type="button"
        onClick={() => setLang("ar")}
        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
          currentLang === "ar"
            ? "bg-sky-600 text-white"
            : "text-slate-600 hover:bg-slate-50"
        }`}
      >
        عربي
      </button>

      <button
        type="button"
        onClick={() => setLang("en")}
        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
          currentLang === "en"
            ? "bg-sky-600 text-white"
            : "text-slate-600 hover:bg-slate-50"
        }`}
      >
        English
      </button>
    </div>
  );
}