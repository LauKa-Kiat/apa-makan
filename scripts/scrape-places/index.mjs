#!/usr/bin/env node
// Re-scrape each mall's food directory and sync it into the `places` table.
//
//   npm run scrape                 # scrape all malls, write an SQL file
//   npm run scrape -- --only=sunway-pyramid,ioi-city-mall
//   npm run scrape -- --apply      # also write straight to Supabase
//
// Env (read from .env.local if present):
//   NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL      to show a diff / apply
//   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY          enough to show a diff
//   SUPABASE_SERVICE_ROLE_KEY                     needed for --apply
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { createClient } from "@supabase/supabase-js";
import { BlockedError } from "./http.mjs";
import { sources } from "./sources.mjs";
import { buildSql } from "./sql.mjs";

/** Fewer shops than this almost always means the site layout changed. */
const MIN_SHOPS = 10;

const { values: args } = parseArgs({
  options: {
    apply: { type: "boolean", default: false },
    only: { type: "string" },
    out: { type: "string" },
  },
});

const today = new Date().toISOString().slice(0, 10);
const outFile = args.out ?? path.join("supabase", "updates", `places-${today}.sql`);
const only = args.only?.split(",").map((s) => s.trim());

/** Tidy one scraped name. */
export function cleanName(raw) {
  let name = raw
    .replace(/\s+/g, " ")
    .trim()
    // Drop where-in-the-mall tags so one shop isn't listed twice:
    // "Starbucks Coffee (Level 3)", "CHAGEE (kiosk)", "Rotiboy (East)".
    .replace(
      /\s*\((?:level\s*\w+|l\d+|lg\d*|g|kiosk|pop ?-?up|flagship|pickup area|east|west|north|south|\w+ wing)\)$/i,
      "",
    );
  // "1978 CUCUR UDANG" -> "1978 Cucur Udang"; short words (KFC, A&W) stay.
  if (/[A-Z]/.test(name) && !/[a-z]/.test(name)) {
    name = name.replace(/[A-Z][A-Z'’]{3,}/g, (w) => w[0] + w.slice(1).toLowerCase());
  }
  return name;
}

export function cleanList(raw) {
  const seen = new Set();
  const out = [];
  for (const item of raw) {
    const name = cleanName(item);
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

function diff(before, after) {
  const b = new Set(before.map((s) => s.toLowerCase()));
  const a = new Set(after.map((s) => s.toLowerCase()));
  return {
    added: after.filter((s) => !b.has(s.toLowerCase())),
    removed: before.filter((s) => !a.has(s.toLowerCase())),
  };
}

function supabaseFromEnv(needWrite) {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = needWrite
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : (process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function main() {
  const picked = sources.filter((s) => !only || only.includes(s.key));
  if (picked.length === 0) {
    console.error(`No source matches --only=${args.only}. Keys: ${sources.map((s) => s.key).join(", ")}`);
    process.exit(1);
  }

  /** @type {{ source: import("./sources.mjs").Source, shops: string[] }[]} */
  const results = [];
  const problems = [];

  for (const source of picked) {
    if (source.skip) {
      console.log(`- ${source.name}: skipped (${source.skip})`);
      problems.push(`${source.name}: ${source.skip}`);
      continue;
    }
    process.stdout.write(`- ${source.name}: scraping… `);
    try {
      const shops = cleanList(await source.scrape());
      if (shops.length < MIN_SHOPS) {
        throw new Error(`only ${shops.length} shops found, site layout may have changed`);
      }
      console.log(`${shops.length} shops`);
      results.push({ source, shops });
    } catch (err) {
      const why = err instanceof BlockedError ? "blocked by a bot check" : err.message;
      console.log(`FAILED (${why})`);
      problems.push(`${source.name}: ${why}`);
    }
  }

  if (results.length === 0) {
    console.error("\nNothing scraped. No SQL written.");
    process.exit(1);
  }

  const sql = buildSql(results, today);
  await mkdir(path.dirname(outFile), { recursive: true });
  await writeFile(outFile, sql);
  console.log(`\nSQL written to ${outFile}`);

  const supabase = supabaseFromEnv(args.apply);
  if (!supabase) {
    if (args.apply) {
      console.error("\n--apply needs SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.");
      process.exit(1);
    }
    console.log("No Supabase env set, so no diff shown. Run the SQL file in the Supabase SQL editor.");
  } else {
    const { data: rows, error } = await supabase.from("places").select("name, shops");
    if (error) throw new Error(`Reading places failed: ${error.message}`);

    console.log("\nChanges:");
    const plan = [];
    for (const { source, shops } of results) {
      const hits = rows.filter((r) => source.match.test(r.name));
      if (hits.length > 1) {
        console.log(`  ${source.name}: ${hits.length} rows match (${hits.map((h) => h.name).join(", ")}), not touched`);
        problems.push(`${source.name}: more than one row matches`);
        continue;
      }
      const row = hits[0];
      const before = Array.isArray(row?.shops) ? row.shops : [];
      const { added, removed } = diff(before, shops);
      console.log(
        `  ${row ? row.name : `${source.name} (new row)`}: ${before.length} -> ${shops.length}` +
          ` | +${added.length} -${removed.length}`,
      );
      if (added.length) console.log(`    + ${added.join(", ")}`);
      if (removed.length) console.log(`    - ${removed.join(", ")}`);
      plan.push({ row, source, shops });
    }

    if (args.apply) {
      console.log("\nApplying…");
      for (const { row, source, shops } of plan) {
        const { error: writeError } = row
          ? await supabase.from("places").update({ shops }).eq("name", row.name)
          : await supabase.from("places").insert({ name: source.name, shops });
        if (writeError) {
          console.log(`  ${source.name}: FAILED (${writeError.message})`);
          problems.push(`${source.name}: write failed`);
        } else {
          console.log(`  ${row ? row.name : source.name}: saved`);
        }
      }
    }
  }

  if (problems.length) {
    console.log("\nNeeds attention:");
    for (const p of problems) console.log(`  - ${p}`);
    process.exitCode = 2;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
