/** Uniform random integer in [0, max). Uses crypto when available. */
export function randomInt(max: number): number {
  if (max <= 0) throw new RangeError("max must be > 0");
  const cryptoObj = globalThis.crypto;
  if (cryptoObj?.getRandomValues) {
    // Rejection sampling avoids modulo bias.
    const limit = Math.floor(0x1_0000_0000 / max) * max;
    const buf = new Uint32Array(1);
    do {
      cryptoObj.getRandomValues(buf);
    } while (buf[0] >= limit);
    return buf[0] % max;
  }
  return Math.floor(Math.random() * max);
}

/** Fisher–Yates shuffle, returns a new array. */
export function shuffle<T>(items: readonly T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Picks `count` items at random, always including `mustInclude`
 * (at a random position).
 */
export function sampleWith<T>(
  items: readonly T[],
  count: number,
  mustInclude: T,
): T[] {
  const others = items.filter((item) => item !== mustInclude);
  const picked = shuffle(others).slice(0, Math.max(0, count - 1));
  picked.splice(randomInt(picked.length + 1), 0, mustInclude);
  return picked;
}
