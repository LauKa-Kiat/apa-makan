"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Dices } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Place } from "@/lib/places";
import { randomInt, sampleWith } from "@/lib/random";
import { LocationFilter } from "./location-filter";
import { ResultCard } from "./result-card";
import { ShopList } from "./shop-list";
import type { PoolItem } from "./types";
import { SPIN_MS, Wheel } from "./wheel";

/** Most slices drawn on the wheel. The winner is always drawn from the full pool. */
const MAX_SLICES = 12;

function listNames(names: string[]) {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** Evenly spread preview so the idle wheel shows a mix of malls. */
function previewSlices(pool: PoolItem[]) {
  const count = Math.min(pool.length, MAX_SLICES);
  return Array.from(
    { length: count },
    (_, i) => pool[Math.floor((i * pool.length) / count)],
  );
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function FoodPicker({ places }: { places: Place[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [spinSlices, setSpinSlices] = useState<PoolItem[] | null>(null);
  const [rotation, setRotation] = useState(0);
  const [animate, setAnimate] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<PoolItem | null>(null);
  const pending = useRef<{ winner: PoolItem; timer: number } | null>(null);

  const activePlaces = useMemo(
    () =>
      selected.length === 0
        ? places
        : places.filter((p) => selected.includes(p.name)),
    [places, selected],
  );

  const pool = useMemo<PoolItem[]>(
    () =>
      activePlaces.flatMap((place) =>
        place.shops.map((shop) => ({
          id: `${place.name}::${shop}`,
          shop,
          place: place.name,
        })),
      ),
    [activePlaces],
  );

  const slices = spinSlices ?? previewSlices(pool);

  const finishSpin = useCallback(() => {
    const done = pending.current;
    if (!done) return;
    window.clearTimeout(done.timer);
    pending.current = null;
    setResult(done.winner);
    setSpinning(false);
  }, []);

  const spin = useCallback(() => {
    if (spinning || pool.length === 0) return;

    const winner = pool[randomInt(pool.length)];
    const next = sampleWith(pool, MAX_SLICES, winner);
    const seg = 360 / next.length;
    const centre = (next.indexOf(winner) + 0.5) * seg;
    // Land somewhere inside the winning slice, not always dead centre.
    const jitter = ((randomInt(1000) / 1000) - 0.5) * seg * 0.6;
    const landing = (((-centre - jitter) % 360) + 360) % 360;
    const base = rotation - (((rotation % 360) + 360) % 360);
    const turns = 5 + randomInt(3);
    const target = base + turns * 360 + landing;

    setSpinSlices(next);
    setRotation(target);

    if (prefersReducedMotion()) {
      setAnimate(false);
      setResult(winner);
      return;
    }

    setAnimate(true);
    setResult(null);
    setSpinning(true);
    // Fallback in case transitionend never fires (e.g. tab hidden).
    const timer = window.setTimeout(finishSpin, SPIN_MS + 400);
    pending.current = { winner, timer };
  }, [finishSpin, pool, rotation, spinning]);

  const updateSelection = (next: string[]) => {
    setSelected(next);
    setSpinSlices(null);
    setResult(null);
  };

  const toggle = (name: string) =>
    updateSelection(
      selected.includes(name)
        ? selected.filter((n) => n !== name)
        : [...selected, name],
    );

  const onlyThisMall =
    result !== null && selected.length === 1 && selected[0] === result.place;

  const summary =
    selected.length === 0
      ? `Spinning across all ${pool.length} shops in ${places.length} ${places.length === 1 ? "place" : "places"}.`
      : `Spinning across ${pool.length} ${pool.length === 1 ? "shop" : "shops"} at ${listNames(activePlaces.map((p) => p.name))}.`;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid items-start gap-8 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:gap-x-12">
        <section
          aria-labelledby="where-heading"
          className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6 lg:col-start-1 lg:row-start-1"
        >
          <h2 id="where-heading" className="text-xl font-semibold">
            Where are you makan-ing?
          </h2>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">
            Leave it on <strong className="font-medium text-foreground">All places</strong>{" "}
            for a surprise, or tap one or more malls.
          </p>
          <LocationFilter
            places={places}
            selected={selected}
            disabled={spinning}
            onToggle={toggle}
            onClear={() => updateSelection([])}
          />
          <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
            {summary}
          </p>
        </section>

        <div className="flex flex-col items-center gap-6 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <Wheel
            slices={slices}
            rotation={rotation}
            animate={animate}
            onSpinEnd={finishSpin}
          />
          <Button
            size="lg"
            onClick={spin}
            disabled={spinning || pool.length === 0}
            className="h-14 w-full max-w-xs rounded-full text-base font-semibold shadow-lg shadow-primary/25"
          >
            <Dices className="!size-5" aria-hidden />
            {spinning ? "Spinning…" : result ? "Spin again" : "Spin the wheel"}
          </Button>
          {pool.length > MAX_SLICES && (
            <p className="-mt-2 max-w-xs text-center text-xs text-muted-foreground">
              The wheel shows {MAX_SLICES} of {pool.length} shops each spin.
              Every shop has the same chance.
            </p>
          )}
        </div>

        <div className="lg:col-start-1 lg:row-start-2">
          <ResultCard
            result={result}
            spinning={spinning}
            canSpin={pool.length > 0}
            onlyThisMall={onlyThisMall}
            onFocusMall={(place) => updateSelection([place])}
          />
        </div>
      </div>

      <ShopList pool={pool} highlightId={result?.id} />
    </div>
  );
}
