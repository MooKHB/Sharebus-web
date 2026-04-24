"use client";

type ToastType = "success" | "error" | "info";

export default function Toast({
  message,
  type = "info",
  onClose,
}: {
  message: string;
  type?: ToastType;
  onClose: () => void;
}) {
  if (!message) return null;

  const styles =
    type === "success"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : type === "error"
      ? "bg-red-50 text-red-700 ring-red-100"
      : "bg-sky-50 text-sky-700 ring-sky-100";

  return (
    <div className="fixed bottom-6 left-1/2 z-50 w-[calc(100%-32px)] max-w-md -translate-x-1/2">
      <div
        className={`flex items-center justify-between gap-4 rounded-2xl px-5 py-4 text-sm font-semibold shadow-xl ring-1 ${styles}`}
      >
        <span>{message}</span>

        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-white/70 px-3 py-1 text-xs"
        >
          إغلاق
        </button>
      </div>
    </div>
  );
}