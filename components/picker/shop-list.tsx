"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { PoolItem } from "./types";

type ShopListProps = {
  pool: PoolItem[];
  highlightId?: string;
};

export function ShopList({ pool, highlightId }: ShopListProps) {
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const byPlace = new Map<string, PoolItem[]>();
    for (const item of pool) {
      if (q && !item.shop.toLowerCase().includes(q)) continue;
      const list = byPlace.get(item.place) ?? [];
      list.push(item);
      byPlace.set(item.place, list);
    }
    return [...byPlace.entries()];
  }, [pool, query]);

  const shown = groups.reduce((sum, [, items]) => sum + items.length, 0);

  return (
    <details className="group rounded-2xl border bg-card shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl p-5 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-6 [&::-webkit-details-marker]:hidden">
        <span>
          What&apos;s in the wheel?{" "}
          <span className="text-muted-foreground">
            ({pool.length} {pool.length === 1 ? "shop" : "shops"})
          </span>
        </span>
        <ChevronDown
          className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>

      <div className="border-t p-5 sm:p-6">
        <label className="relative block">
          <span className="sr-only">Search shops</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search shops…"
            className="h-10 pl-9"
          />
        </label>

        {shown === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No shops match &ldquo;{query}&rdquo;.
          </p>
        ) : (
          <div className="mt-5 flex flex-col gap-6">
            {groups.map(([place, items]) => (
              <section key={place} aria-label={place}>
                <h3 className="mb-2 text-sm font-semibold">
                  {place}{" "}
                  <span className="font-sans font-normal text-muted-foreground">
                    · {items.length}
                  </span>
                </h3>
                <ul className="flex flex-wrap gap-1.5">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className={cn(
                        "max-w-full truncate rounded-md border px-2.5 py-1 text-sm",
                        item.id === highlightId
                          ? "border-primary bg-primary text-primary-foreground"
                          : "bg-background",
                      )}
                    >
                      {item.shop}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}
