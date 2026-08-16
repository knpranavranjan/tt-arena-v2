export function SectionDivider() {
  return (
    <div className="relative h-px w-full bg-border" aria-hidden="true">
      <div
        className="absolute inset-x-0 top-0 h-px opacity-60"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, var(--color-border) 0 1px, transparent 1px 12px)",
        }}
      />
    </div>
  );
}
