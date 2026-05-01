import Link from "next/link";
import NavAuth from "./NavAuth";

export default function SiteHeader() {
  return (
    <header className="bg-[#eef8ff] px-6 pt-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-3xl bg-white/70 px-5 py-4 shadow-sm ring-1 ring-white/70">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
            <img
              src="/sharebus-logo.png"
              alt="Share Bus"
              className="h-9 w-9 object-contain"
            />
          </div>

          <div>
            <div className="text-lg font-bold text-slate-950">Share Bus</div>
            <div className="text-xs text-slate-500">Smart Daily Transport</div>
          </div>
        </Link>

        <div className="shrink-0">
          <NavAuth />
        </div>
      </div>
    </header>
  );
}