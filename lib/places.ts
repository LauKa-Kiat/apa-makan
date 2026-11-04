import { createSupabaseClient } from "@/lib/supabase";

/** A mall / location and the food outlets scraped from its directory. */
export type Place = {
  name: string;
  shops: string[];
};

export type PlacesResult =
  | { ok: true; places: Place[] }
  | { ok: false; error: string };

/** Accepts a text[] column, a JSON array, or a JSON string of one. */
function toShopList(raw: unknown): string[] {
  let list: unknown = raw;
  if (typeof list === "string") {
    try {
      list = JSON.parse(list);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(list)) return [];

  const seen = new Set<string>();
  const shops: string[] = [];
  for (const item of list) {
    if (typeof item !== "string") continue;
    const shop = item.replace(/\s+/g, " ").trim();
    const key = shop.toLowerCase();
    if (!shop || seen.has(key)) continue;
    seen.add(key);
    shops.push(shop);
  }
  return shops.sort((a, b) => a.localeCompare(b));
}

export function normalizePlaces(
  rows: { name: unknown; shops: unknown }[],
): Place[] {
  return rows
    .map((row) => ({
      name: typeof row.name === "string" ? row.name.trim() : "",
      shops: toShopList(row.shops),
    }))
    .filter((place) => place.name && place.shops.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getPlaces(): Promise<PlacesResult> {
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("places")
      .select("name, shops");

    if (error) return { ok: false, error: error.message };
    return { ok: true, places: normalizePlaces(data ?? []) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
