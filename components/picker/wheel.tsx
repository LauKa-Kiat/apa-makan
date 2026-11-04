"use client";

import { UtensilsCrossed } from "lucide-react";
import type { PoolItem } from "./types";

const R = 100;
const HUB = 20;
const SLICE_COLORS = [1, 2, 3, 4] as const;
const RIM_LIGHTS = 24;

export const SPIN_MS = 4800;

type WheelProps = {
  slices: PoolItem[];
  rotation: number;
  /** Animate to `rotation`. False = jump instantly (reduced motion). */
  animate: boolean;
  onSpinEnd: () => void;
};

function point(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  // 0° is 12 o'clock, angles grow clockwise.
  return { x: radius * Math.sin(rad), y: -radius * Math.cos(rad) };
}

function slicePath(start: number, end: number) {
  const a = point(start, R);
  const b = point(end, R);
  const largeArc = end - start > 180 ? 1 : 0;
  return `M0 0 L${a.x} ${a.y} A${R} ${R} 0 ${largeArc} 1 ${b.x} ${b.y} Z`;
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** Colour index per slice; avoids two equal neighbours when wrapping round. */
function colorFor(i: number, count: number) {
  if (count % SLICE_COLORS.length === 1 && i === count - 1) {
    return SLICE_COLORS[1];
  }
  return SLICE_COLORS[i % SLICE_COLORS.length];
}

export function Wheel({ slices, rotation, animate, onSpinEnd }: WheelProps) {
  const count = Math.max(slices.length, 1);
  const seg = 360 / count;
  const fontSize = count <= 4 ? 11 : count <= 8 ? 9.5 : 8;
  const maxChars = Math.floor((R - HUB - 14) / (fontSize * 0.56));

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[420px]">
      {/* Pointer */}
      <svg
        viewBox="0 0 40 44"
        className="absolute left-1/2 top-0 z-10 w-9 -translate-x-1/2 -translate-y-2 drop-shadow-md"
        aria-hidden
      >
        <path
          d="M4 4 H36 L20 40 Z"
          className="fill-foreground stroke-background"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </svg>

      <div className="absolute inset-0 overflow-hidden rounded-full bg-foreground/90 p-[3.5%] shadow-xl shadow-primary/20">
        <div
          className="relative size-full rounded-full will-change-transform"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: animate
              ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.75, 0.1, 1)`
              : "none",
          }}
          onTransitionEnd={(e) => {
            if (e.target === e.currentTarget && e.propertyName === "transform") {
              onSpinEnd();
            }
          }}
        >
          <svg
            viewBox={`${-R} ${-R} ${R * 2} ${R * 2}`}
            className="size-full overflow-visible"
            role="img"
            aria-label={`Wheel with ${slices.length} food spots`}
          >
            {slices.length === 0 ? (
              <circle r={R} className="fill-muted" />
            ) : slices.length === 1 ? (
              <circle r={R} style={{ fill: "hsl(var(--slice-1))" }} />
            ) : (
              slices.map((item, i) => {
                const c = colorFor(i, slices.length);
                return (
                  <path
                    key={`${item.id}-${i}`}
                    d={slicePath(i * seg, (i + 1) * seg)}
                    style={{ fill: `hsl(var(--slice-${c}))` }}
                    className="stroke-foreground/20"
                    strokeWidth={0.6}
                  >
                    <title>{`${item.shop} · ${item.place}`}</title>
                  </path>
                );
              })
            )}

            {slices.map((item, i) => {
              const c = colorFor(i, slices.length);
              const center = (i + 0.5) * seg;
              return (
                <text
                  key={`label-${item.id}-${i}`}
                  transform={`rotate(${center - 90})`}
                  x={R - 9}
                  y={0}
                  textAnchor="end"
                  dominantBaseline="central"
                  fontSize={fontSize}
                  fontWeight={600}
                  style={{ fill: `hsl(var(--slice-${c}-fg))` }}
                  className="pointer-events-none select-none"
                >
                  {truncate(item.shop, maxChars)}
                </text>
              );
            })}

            {Array.from({ length: RIM_LIGHTS }, (_, i) => {
              const p = point((i * 360) / RIM_LIGHTS, R - 3);
              return (
                <circle
                  key={`light-${i}`}
                  cx={p.x}
                  cy={p.y}
                  r={1.4}
                  className="fill-background/80"
                />
              );
            })}
          </svg>
        </div>

        {/* Hub (does not rotate) */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 grid size-[19%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-foreground/90 bg-background text-primary shadow-md">
          <UtensilsCrossed className="size-1/2" aria-hidden />
        </div>
      </div>
    </div>
  );
}
