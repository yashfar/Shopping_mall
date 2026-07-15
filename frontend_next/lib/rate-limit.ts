/**
 * Simple in-memory rate limiter.
 *
 * Works correctly on a single-server deployment.
 * For serverless / multi-instance deployments (Vercel, etc.) upgrade to
 * a Redis-backed solution such as @upstash/ratelimit — each serverless
 * function instance has its own memory, so a Map-based limiter cannot
 * enforce limits across instances.
 *
 * Usage:
 *   const result = rateLimit(ip, { windowMs: 60_000, max: 5 });
 *   if (!result.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

interface RateLimitOptions {
    /** Rolling window in milliseconds */
    windowMs: number;
    /** Maximum requests per window */
    max: number;
}

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes to prevent unbounded memory growth
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
        if (entry.resetAt <= now) store.delete(key);
    }
}, 5 * 60 * 1000);

export function rateLimit(
    key: string,
    { windowMs, max }: RateLimitOptions
): RateLimitResult {
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || entry.resetAt <= now) {
        // Start a new window
        store.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, remaining: max - 1, resetAt: now + windowMs };
    }

    entry.count += 1;
    const remaining = Math.max(0, max - entry.count);

    return {
        allowed: entry.count <= max,
        remaining,
        resetAt: entry.resetAt,
    };
}

/**
 * Extract the client IP from a Next.js Request.
 * Works behind Vercel / common reverse proxies.
 */
export function getClientIp(req: Request): string {
    return (
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        req.headers.get("x-real-ip") ??
        "unknown"
    );
}
