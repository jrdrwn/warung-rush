// Warung Rush — a small seeded random generator, so a screenshot scene staged
// from a seed always looks the same, and live play can still be seeded from the
// clock. Mulberry32: tiny, fast, and good enough for spawning customers.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick one element of an array with the given random function. */
export function pick(rng, items) {
  return items[Math.floor(rng() * items.length)];
}

/** An integer in [min, max] with the given random function. */
export function intBetween(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}
