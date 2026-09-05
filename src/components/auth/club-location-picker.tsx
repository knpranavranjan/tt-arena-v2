"use client";

import { useState } from "react";
import { Crosshair, MapPin } from "lucide-react";

/**
 * How a club's map marker is placed:
 *  - `address`  — geocoded from the Club Address field (the default)
 *  - `current`  — an exact pin from the browser's geolocation
 */
export type ClubLocation = { mode: "address" } | { mode: "current"; lat: string; lng: string };

export const DEFAULT_CLUB_LOCATION: ClubLocation = { mode: "address" };

function optionClass(active: boolean) {
  return `flex-1 rounded-none border px-3 py-3 text-left transition-colors ${
    active
      ? "border-[#ff2448] bg-[#ff2448]/10 text-white"
      : "border-white/10 bg-[#0a0a0a] text-[#8b8b93] hover:border-white/25 hover:text-[#c2c6d7]"
  }`;
}

export function ClubLocationPicker({
  value,
  onChange,
  address,
}: {
  value: ClubLocation;
  onChange: (next: ClubLocation) => void;
  address: string;
}) {
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const requestGeolocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError("Location isn't available in this browser — the map will use your address.");
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({
          mode: "current",
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        });
        setLocating(false);
      },
      () => {
        setGeoError("Couldn't get your location — the map will use your address instead.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const mapSrc =
    value.mode === "current"
      ? `https://www.google.com/maps?q=${value.lat},${value.lng}&z=16&output=embed`
      : address.trim()
        ? `https://www.google.com/maps?q=${encodeURIComponent(address)}&z=15&output=embed`
        : null;

  return (
    <div className="space-y-4 border border-white/10 bg-[#0a0a0a] p-5">
      <div className="flex items-start gap-2">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#ff2448]" strokeWidth={2} />
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white">Club location</p>
          <p className="mt-1 text-xs leading-relaxed text-[#8b8b93]">
            Choose how players will find you on the map. This is used everywhere the club appears.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => onChange({ mode: "address" })}
          className={optionClass(value.mode === "address")}
        >
          <span className="block text-[11px] font-bold uppercase tracking-widest">Use club address</span>
          <span className="mt-0.5 block text-[11px] leading-snug text-[#8b8b93]">
            Marker placed from the Club Address entered above.
          </span>
        </button>
        <button
          type="button"
          onClick={() => (value.mode === "current" ? undefined : requestGeolocation())}
          className={optionClass(value.mode === "current")}
        >
          <span className="block text-[11px] font-bold uppercase tracking-widest">Use current location</span>
          <span className="mt-0.5 block text-[11px] leading-snug text-[#8b8b93]">
            {value.mode === "current"
              ? `Pinned at ${value.lat}, ${value.lng}`
              : "Drop the marker exactly where you are right now."}
          </span>
        </button>
      </div>

      {value.mode === "current" && (
        <button
          type="button"
          onClick={requestGeolocation}
          disabled={locating}
          className="flex w-full items-center justify-center gap-2 border border-white/15 py-2.5 text-xs font-bold uppercase tracking-widest text-[#e2e2e8] transition-colors hover:border-white/30 hover:bg-white/5 disabled:opacity-50"
        >
          <Crosshair className="h-3.5 w-3.5" strokeWidth={2} />
          {locating ? "Getting location…" : "Update to my current location"}
        </button>
      )}

      {geoError && <p className="text-xs text-[#ff8f86]">{geoError}</p>}

      <div className="overflow-hidden border border-white/10">
        {mapSrc ? (
          <iframe
            title="Club location preview"
            src={mapSrc}
            className="h-44 w-full grayscale invert-[0.9] contrast-[0.85]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="flex h-44 items-center justify-center bg-[#0e0e0e] px-4 text-center text-xs text-[#5a5a60]">
            Enter the club address above to preview the map.
          </div>
        )}
      </div>
    </div>
  );
}
