/**
 * A small seedable random number generator (mulberry32), so a run can be replayed exactly and
 * saved mid-way: its whole state is one 32-bit number.
 */
export class Rng {
  /** The seed this stream started from. */
  readonly seed: number;
  private state: number;

  constructor(seed: number, state: number = seed) {
    this.seed = seed >>> 0;
    this.state = state >>> 0;
  }

  /** The next number in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** A fresh 32-bit seed drawn from this stream, for starting an independent stream (e.g. one fight). */
  nextSeed(): number {
    return Math.floor(this.next() * 4294967296) >>> 0;
  }

  /** Where the stream is now; with `seed`, enough to restore it exactly (see `Rng.restore`). */
  get position(): number {
    return this.state;
  }

  static restore(seed: number, position: number): Rng {
    return new Rng(seed, position);
  }
}

/** A seed for a new run when none is given. */
export function randomSeed(): number {
  return Math.floor(Math.random() * 4294967296) >>> 0;
}
