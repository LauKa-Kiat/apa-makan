"use client";

import { ExternalLink, Filter, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PoolItem } from "./types";

type ResultCardProps = {
  result: PoolItem | null;
  spinning: boolean;
  canSpin: boolean;
  onlyThisMall: boolean;
  onFocusMall: (place: string) => void;
};

function mapsUrl(item: PoolItem) {
  const query = encodeURIComponent(`${item.shop} ${item.place}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function ResultCard({
  result,
  spinning,
  canSpin,
  onlyThisMall,
  onFocusMall,
}: ResultCardProps) {
  return (
    <section
      aria-labelledby="result-heading"
      className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm sm:p-6"
    >
      <h2 id="result-heading" className="sr-only">
        Your pick
      </h2>
      <div aria-live="polite" aria-atomic="true" className="min-h-[7.5rem]">
        {spinning ? (
          <div className="flex h-full min-h-[7.5rem] flex-col items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
            <p className="text-sm">Spinning… hold your hunger.</p>
          </div>
        ) : result ? (
          <div className="animate-in fade-in zoom-in-95 duration-300">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Jom makan at
            </p>
            <p className="mt-1 break-words font-[family-name:var(--font-display)] text-3xl font-bold leading-tight sm:text-4xl">
              {result.shop}
            </p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">
              <MapPin className="size-3.5 text-primary" aria-hidden />
              {result.place}
            </p>
          </div>
        ) : (
          <div className="flex h-full min-h-[7.5rem] flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Your pick
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold text-muted-foreground">
              {canSpin ? "Spin the wheel to find out." : "Pick a place with shops."}
            </p>
          </div>
        )}
      </div>

      {result && !spinning && (
        <div className="mt-5 flex flex-wrap gap-2">
          {!onlyThisMall && (
            <Button
              variant="outline"
              className="max-w-full"
              onClick={() => onFocusMall(result.place)}
            >
              <Filter aria-hidden />
              <span className="truncate">Only {result.place}</span>
            </Button>
          )}
          <Button variant="ghost" asChild>
            <a href={mapsUrl(result)} target="_blank" rel="noreferrer">
              <ExternalLink aria-hidden />
              Find on Maps
            </a>
          </Button>
        </div>
      )}
    </section>
  );
}
