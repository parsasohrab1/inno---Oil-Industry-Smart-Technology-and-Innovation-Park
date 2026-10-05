import type { NextFunction, Request, Response } from 'express'

interface Bucket {
  count: number
  resetAt: number
}

/** Simple in-memory rate limiter (no external dependency). */
export function rateLimit(opts: { windowMs: number; limit: number }) {
  const buckets = new Map<string, Bucket>()

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip ?? req.socket.remoteAddress ?? 'unknown'
    const now = Date.now()
    let b = buckets.get(key)
    if (!b || b.resetAt <= now) {
      b = { count: 0, resetAt: now + opts.windowMs }
      buckets.set(key, b)
    }
    b.count += 1
    res.setHeader('RateLimit-Limit', String(opts.limit))
    res.setHeader('RateLimit-Remaining', String(Math.max(0, opts.limit - b.count)))
    if (b.count > opts.limit) {
      res.status(429).json({ error: 'Too many requests; try again in a moment' })
      return
    }
    next()
  }
}
