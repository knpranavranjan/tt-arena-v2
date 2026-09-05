"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

const mono = { fontFamily: "var(--font-home-mono)" };
const MAX_BYTES = 3 * 1024 * 1024;

/**
 * Standardised tournament poster picker: one portrait image, cropped to a fixed
 * 4:5 frame so every event poster on the platform reads the same way. Stores the
 * image as a data URL (this demo has no upload backend).
 */
export function PosterUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (dataUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
      setError("Use a PNG, JPG or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("That image is over 3 MB — please compress it first.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <p className="mb-4 text-xs leading-relaxed text-[#8b8b93]">
        Optional. Portrait poster shown on the event page — cropped to a standard 4:5 frame
        (1080&nbsp;&times;&nbsp;1350 recommended). PNG, JPG or WebP, up to 3&nbsp;MB.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {value ? (
        <div className="flex items-start gap-4">
          <div className="aspect-[4/5] w-40 shrink-0 overflow-hidden rounded-[6px] border border-white/10 bg-[#1a1c20]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Poster preview" className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-[4px] border border-white/15 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#e2e2e8] transition-colors hover:border-white/30 hover:bg-white/5"
              style={mono}
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => {
                onChange("");
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="flex items-center gap-1.5 rounded-[4px] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#8b8b93] transition-colors hover:bg-white/5 hover:text-[#e2e2e8]"
              style={mono}
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex aspect-[4/5] w-40 flex-col items-center justify-center gap-2 rounded-[6px] border border-dashed border-white/15 bg-[#1a1c20] text-center text-[#8b8b93] transition-colors hover:border-white/30 hover:bg-white/[0.04]"
        >
          <ImagePlus className="h-6 w-6" strokeWidth={1.5} />
          <span className="px-3 text-[11px] font-semibold uppercase tracking-wide" style={mono}>
            Upload poster
          </span>
        </button>
      )}

      {error && <p className="mt-2 text-xs text-[#ff8f86]">{error}</p>}
    </div>
  );
}
