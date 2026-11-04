export function PickerSkeleton() {
  return (
    <div
      className="grid animate-pulse gap-8 lg:grid-cols-2"
      aria-busy="true"
      aria-label="Loading food spots"
    >
      <div className="flex flex-col gap-6">
        <div className="h-40 rounded-2xl border bg-card" />
        <div className="h-44 rounded-2xl border bg-card" />
      </div>
      <div className="mx-auto aspect-square w-full max-w-[420px] rounded-full bg-muted" />
    </div>
  );
}
