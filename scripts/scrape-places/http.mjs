// Small, polite HTTP helpers for the directory scraper.

const USER_AGENT =
  "apa-makan-directory-sync/1.0 (+https://github.com/LauKa-Kiat/apa-makan)";
const DELAY_MS = 600;
const RETRIES = 2;

let lastRequest = 0;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class BlockedError extends Error {
  constructor(url) {
    super(`Blocked by a bot check at ${url}`);
    this.name = "BlockedError";
  }
}

/** GET a URL and return its body as text. One request at a time, spaced out. */
export async function getText(url) {
  for (let attempt = 0; ; attempt++) {
    const wait = lastRequest + DELAY_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastRequest = Date.now();

    try {
      const res = await fetch(url, {
        headers: { "user-agent": USER_AGENT, accept: "*/*" },
        signal: AbortSignal.timeout(30_000),
      });
      const body = await res.text();
      // We never try to get past a bot check: report it and move on.
      if (/<title>\s*just a moment/i.test(body) || /cf-chl-/i.test(body)) {
        throw new BlockedError(url);
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return body;
    } catch (err) {
      if (err instanceof BlockedError || attempt >= RETRIES) throw err;
      await sleep(1000 * 2 ** attempt);
    }
  }
}

export async function getJson(url) {
  return JSON.parse(await getText(url));
}
