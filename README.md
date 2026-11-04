# Apa Makan?

Can't decide what to eat? Spin the wheel.

- Leave the filter on **All places** to pick from every food spot we know.
- Tap one or more malls to pick only from those.
- Each spin picks one shop uniformly at random from the current selection.
  The wheel shows up to 12 of them; the winner is always on it.

Shop lists are scraped by hand from each mall's food directory and stored in Supabase.

## Stack

Next.js (App Router) · Tailwind CSS · Supabase (read-only, no accounts).

## Data

One table, `places`:

| column  | type                 | notes                         |
| ------- | -------------------- | ----------------------------- |
| `name`  | `text`               | Mall / location name          |
| `shops` | `text[]` (or `json`) | Food outlets at that location |

The app needs anonymous `select` access on `places` (an RLS policy allowing `select` for `anon`).
Blank names and duplicate shops are cleaned up on load.

## Run locally

Requires Node **24.22.1** (see `.nvmrc`).

```bash
cp .env.example .env.local   # then fill in your Supabase URL + publishable key
npm install
npm run dev
```

Open http://localhost:3000.

## Scripts

- `npm run dev` – dev server
- `npm run build` / `npm start` – production build and server
- `npm run lint` – ESLint
- `npm run scrape` – re-scrape the mall food directories (see below)

## Updating the shop lists

`npm run scrape` fetches each mall's food directory and writes
`supabase/updates/places-<date>.sql`. Paste that file into the Supabase SQL editor and run it.
Each mall row is found by a name pattern, so "Pavilion KL" and "Pavilion Kuala Lumpur" both match.
A mall with no row gets one inserted. If a pattern matches more than one row, the script stops and nothing changes.

```bash
npm run scrape                                   # all malls
npm run scrape -- --only=sunway-pyramid          # one mall (keys in scripts/scrape-places/sources.mjs)
npm run scrape -- --apply                        # also write straight to Supabase
```

With `NEXT_PUBLIC_SUPABASE_URL` and a key in `.env.local`, the script also prints what shops were added or removed.
`--apply` needs `SUPABASE_SERVICE_ROLE_KEY`. Keep that key out of the app and out of git.

| Mall                    | Source                                   |
| ----------------------- | ---------------------------------------- |
| Mid Valley Megamall     | midvalley.com.my/food/directory          |
| Sunway Pyramid          | sunwaypyramid.com directory API (F&B)    |
| Pavilion Kuala Lumpur   | pavilion-kl.com/dine                     |
| IOI City Mall           | ioicitymall.com.my directory (F&B)       |
| 1 Utama Shopping Centre | skipped: site has a Cloudflare bot check |

Requests are spaced out and sent with an honest user agent. Sites that show a bot check are skipped, not worked around.
If a site changes its layout, that mall fails with a message and its row is left alone.
