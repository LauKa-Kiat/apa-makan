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
