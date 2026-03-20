/**
 * Simple in-memory rate limiter for API routes.
 * Tracks requests per key (IP or identifier) within a sliding window.
 * Note: This resets on server restart and is per-instance only.
 * For production scale, replace with Redis-backed limiter.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 60 seconds
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    Array.from(store.entries()).forEach(([key, entry]) => {
      if (entry.resetAt < now) {
        store.delete(key);
      }
    });
  }, 60_000);
}

export interface RateLimitConfig {
  /** Maximum requests allowed within the window */
  maxRequests: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check if a request is within rate limits.
 * @param key Unique identifier (e.g., IP address, email, or composite key)
 * @param config Rate limit configuration
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // New window
    store.set(key, { count: 1, resetAt: now + config.windowSeconds * 1000 });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowSeconds * 1000 };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
}

/**
 * Extract client IP from request headers (works behind proxies/Cloud Run).
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "unknown";
}

/** Pre-configured rate limits */
export const RATE_LIMITS = {
  /** OTP send: 5 requests per 5 minutes per IP */
  otpSend: { maxRequests: 5, windowSeconds: 300 } as RateLimitConfig,
  /** OTP verify: 10 attempts per 5 minutes per session */
  otpVerify: { maxRequests: 10, windowSeconds: 300 } as RateLimitConfig,
  /** Event creation: 10 per hour per IP */
  eventCreate: { maxRequests: 10, windowSeconds: 3600 } as RateLimitConfig,
  /** Signup: 3 per hour per IP */
  signup: { maxRequests: 3, windowSeconds: 3600 } as RateLimitConfig,
} as const;
