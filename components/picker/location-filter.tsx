"use client";

import { Check, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Place } from "@/lib/places";

type LocationFilterProps = {
  places: Place[];
  selected: string[];
  disabled?: boolean;
  onToggle: (name: string) => void;
  onClear: () => void;
};

export function LocationFilter({
  places,
  selected,
  disabled,
  onToggle,
  onClear,
}: LocationFilterProps) {
  const allActive = selected.length === 0;
  const total = places.reduce((sum, p) => sum + p.shops.length, 0);

  return (
    <div
      role="group"
      aria-label="Filter by location"
      className="flex flex-wrap gap-2"
    >
      <Chip active={allActive} disabled={disabled} onClick={onClear} count={total}>
        All places
      </Chip>
      {places.map((place) => (
        <Chip
          key={place.name}
          active={selected.includes(place.name)}
          disabled={disabled}
          onClick={() => onToggle(place.name)}
          count={place.shops.length}
          icon
        >
          {place.name}
        </Chip>
      ))}
    </div>
  );
}

function Chip({
  active,
  disabled,
  onClick,
  count,
  icon,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  count: number;
  icon?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "group inline-flex min-h-10 max-w-full items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-input bg-background hover:border-primary/60 hover:bg-secondary",
      )}
    >
      {active ? (
        <Check className="size-3.5 shrink-0" aria-hidden />
      ) : icon ? (
        <MapPin className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      ) : null}
      <span className="truncate">{children}</span>
      <span
        className={cn(
          "rounded-full px-1.5 text-xs tabular-nums",
          active
            ? "bg-primary-foreground/20"
            : "bg-muted text-muted-foreground",
        )}
      >
        {count}
      </span>
    </button>
  );
}
