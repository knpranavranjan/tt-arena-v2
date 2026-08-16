import Image from "next/image";

/**
 * Shared background treatment for card visuals across the site (tournaments,
 * clubs, ...) — a real arena/table photo with a gradient scrim, instead of an
 * abstract placeholder. Used on the home page's tournament showcase, the
 * /tournaments listing, and the /clubs listing.
 *
 * `overlay` (default) is for cards where text sits directly on top of the
 * image and needs a strong scrim to stay legible. `subtle` is for cards where
 * the text sits in its own space below/beside the image (just a status badge
 * on top, if anything) — the photo can show through much more clearly there.
 */
export function ArenaPhotoBackdrop({
  className,
  variant = "overlay",
}: {
  className?: string;
  variant?: "overlay" | "subtle";
}) {
  return (
    <div className={`absolute inset-0 -z-10 ${className ?? ""}`} aria-hidden="true">
      <Image
        src="/clubhero/club.png"
        alt=""
        fill
        sizes="(min-width: 1024px) 50vw, 100vw"
        className={`object-cover grayscale transition-[transform,filter] duration-700 group-hover:scale-105 group-hover:grayscale-0 ${
          variant === "subtle" ? "opacity-100" : "opacity-70"
        }`}
      />
      {variant === "subtle" ? (
        <div className="absolute inset-0 bg-gradient-to-t from-[#111318] via-[#111318]/15 to-transparent" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-t from-[#111318] via-[#111318]/70 to-[#111318]/20" />
      )}
    </div>
  );
}
