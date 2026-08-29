/**
 * مولد اعداد شبه‌تصادفی با seed (mulberry32) — برای تولید داده سنتتیک بازتولیدپذیر.
 */
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export class Rng {
  private next: () => number
  constructor(seed = 42) {
    this.next = mulberry32(seed)
  }
  float(min = 0, max = 1) {
    return min + (max - min) * this.next()
  }
  int(min: number, max: number) {
    return Math.floor(this.float(min, max + 1))
  }
  bool(pTrue = 0.5) {
    return this.next() < pTrue
  }
  pick<T>(arr: readonly T[]): T {
    return arr[this.int(0, arr.length - 1)]
  }
  sample<T>(arr: readonly T[], k: number): T[] {
    const copy = [...arr]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = this.int(0, i)
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy.slice(0, k)
  }
  weighted<T>(items: readonly T[], weights: readonly number[]): T {
    const total = weights.reduce((a, b) => a + b, 0)
    let r = this.float(0, total)
    for (let i = 0; i < items.length; i++) {
      r -= weights[i]
      if (r <= 0) return items[i]
    }
    return items[items.length - 1]
  }
}
