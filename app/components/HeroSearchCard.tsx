"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, Search } from "lucide-react";

declare global {
  interface Window {
    google: any;
  }
}

type Trip = {
  id: number;
  from_location: string;
  to_location: string;
};

type SelectedPlace = {
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
};

export default function HeroSearchCard({
  trips,
}: {
  trips: Trip[];
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<any>(null);

  const [mapsReady, setMapsReady] = useState(false);
  const [destination, setDestination] = useState("");
  const [currentLocationText, setCurrentLocationText] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [searchMessage, setSearchMessage] = useState("");

  useEffect(() => {
    async function loadGoogleMaps() {
      if (window.google?.maps?.places) {
        setMapsReady(true);
        return;
      }

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.error("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");
        return;
      }

      const existingScript = document.getElementById("google-maps-script");
      if (existingScript) {
        existingScript.addEventListener("load", () => setMapsReady(true));
        return;
      }

      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapsReady(true);
      script.onerror = () => {
        console.error("Failed to load Google Maps script");
      };

      document.head.appendChild(script);
    }

    loadGoogleMaps();
  }, []);

  useEffect(() => {
    if (!mapsReady || !inputRef.current || autocompleteRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        fields: ["formatted_address", "geometry", "name"],
        componentRestrictions: { country: "eg" },
      }
    );

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      const lat = place.geometry?.location?.lat?.() ?? null;
      const lng = place.geometry?.location?.lng?.() ?? null;

      const payload: SelectedPlace = {
        name: place.name || "",
        address: place.formatted_address || "",
        lat,
        lng,
      };

      setDestination(place.name || place.formatted_address || "");
      setSelectedPlace(payload);
      setSearchMessage("");
    });

    autocompleteRef.current = autocomplete;
  }, [mapsReady]);

  function getMyLocation() {
    if (!navigator.geolocation) {
      setSearchMessage("المتصفح لا يدعم تحديد الموقع");
      return;
    }

    setLoadingLocation(true);
    setSearchMessage("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setCurrentLocationText(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
        setLoadingLocation(false);
      },
      () => {
        setSearchMessage("تعذر تحديد موقعك الحالي");
        setLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }

  const destinationError =
    submitted && !destination.trim() ? "الوجهة مطلوبة" : "";

  function handleSearch() {
    setSubmitted(true);
    setSearchMessage("");

    if (!destination.trim()) {
      return;
    }

    const normalizedDestination = destination.trim().toLowerCase();

    const result = trips.find((t) =>
      t.to_location.toLowerCase().includes(normalizedDestination)
    );

    if (result) {
      window.location.href = `/book/${result.id}`;
      return;
    }

    const tripsSection = document.getElementById("trips");
    if (tripsSection) {
      setSearchMessage("ملقيناش رحلة مطابقة مباشرة، شوف الرحلات المتاحة تحت.");
      tripsSection.scrollIntoView({ behavior: "smooth" });
      return;
    }

    setSearchMessage("مفيش رحلة مطابقة حاليًا، جرّب من قائمة الرحلات");
  }

  return (
    <div className="relative">
      <div className="absolute inset-0 scale-105 rounded-[32px] bg-sky-400/20 blur-2xl" />

      <div className="relative overflow-hidden rounded-[32px] bg-white/80 p-6 shadow-2xl shadow-sky-900/10 ring-1 ring-white/60 backdrop-blur-xl md:p-7">
        <div className="mb-6">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 ring-1 ring-sky-100">
            <Search size={15} />
            ابحث عن رحلتك
          </div>

          <h2 className="text-2xl font-bold md:text-3xl">
            اعرف أقرب رحلة ليك
          </h2>

          <p className="mt-2 text-sm leading-7 text-slate-500">
            حدّد موقعك الحالي واكتب وجهتك، وهنوجّهك لأقرب رحلة متاحة.
          </p>

          <p className="mt-4 text-xs text-slate-500">
            الحقول اللي عليها <span className="text-red-500">*</span> مطلوبة
          </p>
        </div>

        <div className="space-y-4">
          <button
            type="button"
            onClick={getMyLocation}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700 ring-1 ring-slate-100 transition hover:bg-slate-100"
          >
            <Navigation size={17} className="text-sky-600" />
            {loadingLocation ? "جاري تحديد الموقع..." : "تحديد موقعي الحالي"}
          </button>

          {currentLocationText && (
            <div className="flex items-center gap-2 rounded-2xl bg-sky-50/80 px-4 py-3 text-sm text-slate-600 ring-1 ring-sky-100">
              <MapPin size={16} className="text-sky-600" />
              <span className="truncate">{currentLocationText}</span>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium">
              الوجهة <span className="text-red-500">*</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              placeholder="اكتب المكان اللي رايح له، مثل: مول العرب"
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value);
                setSelectedPlace(null);
                setSearchMessage("");
              }}
              className={`w-full rounded-2xl border bg-white px-4 py-4 text-black outline-none placeholder:text-slate-400 ${
                destinationError
                  ? "border-red-400 focus:ring-4 focus:ring-red-100"
                  : "border-slate-200 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              }`}
            />
            {destinationError && (
              <p className="mt-2 text-xs text-red-500">{destinationError}</p>
            )}
          </div>

          {selectedPlace && (
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
              <p className="text-sm font-medium text-slate-700">
                المكان المختار
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {selectedPlace.name || selectedPlace.address}
              </p>
              {selectedPlace.address && (
                <p className="mt-1 text-xs text-slate-400">
                  {selectedPlace.address}
                </p>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handleSearch}
            className="w-full rounded-2xl bg-sky-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:-translate-y-0.5 hover:bg-sky-700"
          >
            ابحث عن أقرب رحلة
          </button>

          <div className="min-h-[40px] rounded-2xl bg-slate-50 px-4 py-3 text-center text-sm text-slate-700 ring-1 ring-slate-100">
            {searchMessage || "—"}
          </div>
        </div>
      </div>
    </div>
  );
}