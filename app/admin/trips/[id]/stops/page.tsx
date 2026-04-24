"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../lip/supabase-client";
import Toast from "@/app/components/Toast";

type Stop = {
  id: number;
  trip_id: number;
  stop_name: string;
  stop_type: "pickup" | "dropoff" | "both";
  sort_order: number;
  is_active: boolean;
  lat: number | null;
  lng: number | null;
};

declare global {
  interface Window {
    google: any;
    __googleMapsPromise?: Promise<void>;
  }
}

function getGoogleMapsLink(lat?: number | null, lng?: number | null) {
  if (lat == null || lng == null) return null;
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

function loadGoogleMaps() {
  if (typeof window === "undefined") return Promise.reject();

  if (window.google?.maps) return Promise.resolve();

  if (window.__googleMapsPromise) return window.__googleMapsPromise;

  window.__googleMapsPromise = new Promise((resolve, reject) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      reject(new Error("Google Maps API key غير موجود في .env.local"));
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=ar&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("فشل تحميل Google Maps"));

    document.head.appendChild(script);
  });

  return window.__googleMapsPromise;
}

export default function TripStopsPage() {
  const params = useParams();
  const tripId = useMemo(() => Number(params?.id), [params]);

  const [stops, setStops] = useState<Stop[]>([]);
  const [stopName, setStopName] = useState("");
  const [stopType, setStopType] = useState<"pickup" | "dropoff" | "both">(
    "pickup"
  );
  const [sortOrder, setSortOrder] = useState("1");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapSearch, setMapSearch] = useState("");
  const [mapMessage, setMapMessage] = useState("");

  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);

  async function loadStops() {
    if (!tripId || Number.isNaN(tripId)) return;

    const { data, error } = await supabase
      .from("trip_stops")
      .select("id, trip_id, stop_name, stop_type, sort_order, is_active, lat, lng")
      .eq("trip_id", tripId)
      .order("sort_order", { ascending: true });

    if (error) {
      setMessage(`حصل خطأ أثناء تحميل النقاط: ${error.message}`);
      return;
    }

    setStops((data as Stop[] | null) ?? []);
  }

  useEffect(() => {
    loadStops();
  }, [tripId]);

  useEffect(() => {
    if (!isMapOpen) return;

    async function initMap() {
      try {
        setMapMessage("جاري تحميل الخريطة...");
        await loadGoogleMaps();

        if (!mapDivRef.current) return;

        const currentLat = lat.trim() ? Number(lat) : 30.0444;
        const currentLng = lng.trim() ? Number(lng) : 31.2357;

        const center = {
          lat: Number.isNaN(currentLat) ? 30.0444 : currentLat,
          lng: Number.isNaN(currentLng) ? 31.2357 : currentLng,
        };

        placesServiceRef.current = new window.google.maps.places.PlacesService(
  mapRef.current
);

        mapRef.current = new window.google.maps.Map(mapDivRef.current, {
          center,
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });

        if (lat.trim() && lng.trim()) {
          markerRef.current = new window.google.maps.Marker({
            position: center,
            map: mapRef.current,
          });
        }

        mapRef.current.addListener("click", (event: any) => {
          const clickedLat = event.latLng.lat();
          const clickedLng = event.latLng.lng();

          setLat(String(clickedLat));
          setLng(String(clickedLng));

          if (markerRef.current) {
            markerRef.current.setPosition(event.latLng);
          } else {
            markerRef.current = new window.google.maps.Marker({
              position: event.latLng,
              map: mapRef.current,
            });
          }

          setMapMessage("تم اختيار الموقع بنجاح");
        });

        setMapMessage("اضغط على الخريطة لاختيار الموقع");
      } catch (err: any) {
        setMapMessage(err.message || "حصل خطأ أثناء تحميل الخريطة");
      }
    }

    setTimeout(initMap, 100);
  }, [isMapOpen]);

  function resetForm() {
    setStopName("");
    setStopType("pickup");
    setSortOrder("1");
    setLat("");
    setLng("");
    setEditingId(null);
  }

  async function searchOnMap() {
  if (!mapSearch.trim()) {
    setMapMessage("اكتب اسم المكان أولًا");
    return;
  }

  if (!placesServiceRef.current || !mapRef.current) {
    setMapMessage("الخريطة لم تجهز بعد");
    return;
  }

  setMapMessage("جاري البحث...");

  placesServiceRef.current.findPlaceFromQuery(
    {
      query: mapSearch,
      fields: ["name", "geometry", "formatted_address"],
    },
    (results: any[], status: string) => {
      if (
        status !== window.google.maps.places.PlacesServiceStatus.OK ||
        !results?.[0]?.geometry?.location
      ) {
        setMapMessage("لم يتم العثور على المكان أو Places API غير مفعلة");
        return;
      }

      const location = results[0].geometry.location;
      const selectedLat = location.lat();
      const selectedLng = location.lng();

      setLat(String(selectedLat));
      setLng(String(selectedLng));

      mapRef.current.setCenter(location);
      mapRef.current.setZoom(16);

      if (markerRef.current) {
        markerRef.current.setPosition(location);
      } else {
        markerRef.current = new window.google.maps.Marker({
          position: location,
          map: mapRef.current,
        });
      }

      setMapMessage(
        `تم تحديد المكان: ${results[0].name || results[0].formatted_address}`
      );
    }
  );
}

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (!tripId || Number.isNaN(tripId)) {
      setMessage("رقم الرحلة غير صحيح");
      return;
    }

    if (!stopName.trim()) {
      setMessage("اكتب اسم النقطة");
      return;
    }

    const safeSortOrder = Number(sortOrder);
    if (Number.isNaN(safeSortOrder)) {
      setMessage("ترتيب النقطة غير صحيح");
      return;
    }

    const safeLat = lat.trim() === "" ? null : Number(lat);
    const safeLng = lng.trim() === "" ? null : Number(lng);

    if (lat.trim() !== "" && Number.isNaN(safeLat)) {
      setMessage("Latitude غير صحيح");
      return;
    }

    if (lng.trim() !== "" && Number.isNaN(safeLng)) {
      setMessage("Longitude غير صحيح");
      return;
    }

    if (editingId) {
      const { error } = await supabase
        .from("trip_stops")
        .update({
          stop_name: stopName.trim(),
          stop_type: stopType,
          sort_order: safeSortOrder,
          lat: safeLat,
          lng: safeLng,
        })
        .eq("id", editingId);

      if (error) {
        setMessage(`حصل خطأ أثناء تعديل النقطة: ${error.message}`);
        return;
      }

      setMessage("تم تعديل النقطة بنجاح");
    } else {
      const { error } = await supabase.from("trip_stops").insert({
        trip_id: tripId,
        stop_name: stopName.trim(),
        stop_type: stopType,
        sort_order: safeSortOrder,
        is_active: true,
        lat: safeLat,
        lng: safeLng,
      });

      if (error) {
        setMessage(`حصل خطأ أثناء إضافة النقطة: ${error.message}`);
        return;
      }

      setMessage("تمت إضافة النقطة بنجاح");
    }

    resetForm();
    loadStops();
  }

  function startEdit(stop: Stop) {
    setEditingId(stop.id);
    setStopName(stop.stop_name);
    setStopType(stop.stop_type);
    setSortOrder(String(stop.sort_order));
    setLat(stop.lat != null ? String(stop.lat) : "");
    setLng(stop.lng != null ? String(stop.lng) : "");
  }

  async function toggleStopStatus(stop: Stop) {
    const { error } = await supabase
      .from("trip_stops")
      .update({ is_active: !stop.is_active })
      .eq("id", stop.id);

    if (error) {
      setMessage(`حصل خطأ أثناء تحديث الحالة: ${error.message}`);
      return;
    }

    setMessage("تم تحديث حالة النقطة");
    loadStops();
  }

  async function deleteStop(id: number) {
    const confirmed = window.confirm("هل أنت متأكد من حذف النقطة؟");
    if (!confirmed) return;

    const { error } = await supabase.from("trip_stops").delete().eq("id", id);

    if (error) {
      setMessage(`حصل خطأ أثناء حذف النقطة: ${error.message}`);
      return;
    }

    setMessage("تم حذف النقطة");
    loadStops();
  }

  return (
    <main className="min-h-screen bg-[#eef8ff] px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-[32px] bg-white/80 p-8 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <h1 className="text-3xl font-bold">إدارة نقاط الرحلة</h1>
          <p className="mt-2 text-sm text-slate-500">
            إضافة وتعديل نقاط الالتقاء والنزول مع الإحداثيات.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[32px] bg-white/80 p-6 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <input
              value={stopName}
              onChange={(e) => setStopName(e.target.value)}
              placeholder="اسم النقطة"
              className="rounded-2xl border border-slate-200 px-4 py-3"
            />

            <select
              value={stopType}
              onChange={(e) =>
                setStopType(e.target.value as "pickup" | "dropoff" | "both")
              }
              className="rounded-2xl border border-slate-200 px-4 py-3"
            >
              <option value="pickup">pickup</option>
              <option value="dropoff">dropoff</option>
              <option value="both">both</option>
            </select>

            <input
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              placeholder="الترتيب"
              className="rounded-2xl border border-slate-200 px-4 py-3"
            />

            <input
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="Latitude"
              className="rounded-2xl border border-slate-200 px-4 py-3"
            />

            <input
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="Longitude"
              className="rounded-2xl border border-slate-200 px-4 py-3"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white"
            >
              {editingId ? "حفظ التعديل" : "إضافة نقطة"}
            </button>

            <button
              type="button"
              onClick={() => setIsMapOpen(true)}
              className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white"
            >
              اختيار من الخريطة
            </button>

            {lat && lng && (
              <a
                href={getGoogleMapsLink(Number(lat), Number(lng)) ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
              >
                فتح الموقع الحالي
              </a>
            )}

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-2xl bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-800"
              >
                إلغاء التعديل
              </button>
            )}
          </div>
        </form>

        <div className="rounded-2xl bg-white/80 px-4 py-3 text-center text-sm whitespace-pre-line shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          {message || "—"}
        </div>

        <div className="overflow-x-auto rounded-[32px] bg-white/80 p-4 shadow-xl shadow-sky-900/5 ring-1 ring-white/70 backdrop-blur">
          <table className="w-full min-w-[1300px]">
            <thead>
              <tr className="border-b border-slate-100 text-right text-sm text-slate-500">
                <th className="px-4 py-3">الاسم</th>
                <th className="px-4 py-3">النوع</th>
                <th className="px-4 py-3">الترتيب</th>
                <th className="px-4 py-3">Latitude</th>
                <th className="px-4 py-3">Longitude</th>
                <th className="px-4 py-3">الخريطة</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3">إجراء</th>
              </tr>
            </thead>

            <tbody>
              {stops.map((stop) => {
                const mapLink = getGoogleMapsLink(stop.lat, stop.lng);

                return (
                  <tr key={stop.id} className="border-b border-slate-100 text-sm">
                    <td className="px-4 py-4">{stop.stop_name}</td>
                    <td className="px-4 py-4">{stop.stop_type}</td>
                    <td className="px-4 py-4">{stop.sort_order}</td>
                    <td className="px-4 py-4">{stop.lat ?? "—"}</td>
                    <td className="px-4 py-4">{stop.lng ?? "—"}</td>
                    <td className="px-4 py-4">
                      {mapLink ? (
                        <a
                          href={mapLink}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white"
                        >
                          فتح الخريطة
                        </a>
                      ) : (
                        <span className="text-slate-400">لا يوجد موقع</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {stop.is_active ? "مفعلة" : "متوقفة"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(stop)}
                          className="rounded-xl bg-slate-100 px-4 py-2 text-xs"
                        >
                          تعديل
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleStopStatus(stop)}
                          className="rounded-xl bg-amber-500 px-4 py-2 text-xs text-white"
                        >
                          {stop.is_active ? "إيقاف" : "تفعيل"}
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteStop(stop.id)}
                          className="rounded-xl bg-red-600 px-4 py-2 text-xs text-white"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {stops.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    لا توجد نقاط
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isMapOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4">
          <div className="w-full max-w-5xl rounded-[32px] bg-white p-6 shadow-2xl">
            <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold">اختيار الموقع من الخريطة</h2>
                <p className="mt-1 text-sm text-slate-500">
                  ابحث عن المكان أو اضغط على الخريطة لتحديد الإحداثيات.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsMapOpen(false)}
                className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700"
              >
                إغلاق
              </button>
            </div>

            <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto]">
              <input
                value={mapSearch}
                onChange={(e) => setMapSearch(e.target.value)}
                placeholder="ابحث مثل: Mall of Arabia, Cairo"
                className="rounded-2xl border border-slate-200 px-4 py-3"
              />

              <button
                type="button"
                onClick={searchOnMap}
                className="rounded-2xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white"
              >
                بحث
              </button>
            </div>

            <div
              ref={mapDivRef}
              className="h-[440px] w-full overflow-hidden rounded-3xl bg-slate-100"
            />

            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-slate-600">
                {mapMessage}
                <div className="mt-1 font-semibold text-slate-900">
                  Lat: {lat || "—"} | Lng: {lng || "—"}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMapOpen(false)}
                className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white"
              >
                استخدام الموقع المختار
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}