import { HttpError } from "../shared/errors/http-error.js";

/**
 * In-memory fixed-window rate limiter keyed by client IP.
 * Designed for single-instance Render deployments behind a reverse proxy.
 */
export function createRateLimiter({
    windowMs = 15 * 60 * 1000,
    max = 20,
    code = "RATE_LIMITED",
    message = "Terlalu banyak percobaan. Silakan coba lagi beberapa saat lagi.",
} = {}) {
    const hits = new Map();

    const sweepTimer = setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of hits.entries()) {
            if (entry.resetAt <= now) {
                hits.delete(key);
            }
        }
    }, Math.max(windowMs, 60_000));
    sweepTimer.unref?.();

    return (req, res, next) => {
        const isTest = process.env.NODE_ENV === "test";
        if (isTest && req.get("x-test-rate-limit") !== "1") {
            return next();
        }

        const key = req.ip || req.socket?.remoteAddress || "unknown";
        const now = Date.now();
        let entry = hits.get(key);

        if (!entry || entry.resetAt <= now) {
            entry = { count: 0, resetAt: now + windowMs };
            hits.set(key, entry);
        }

        entry.count += 1;

        const remaining = Math.max(0, max - entry.count);
        const retryAfterSec = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));

        res.setHeader("RateLimit-Limit", String(max));
        res.setHeader("RateLimit-Remaining", String(remaining));
        res.setHeader("RateLimit-Reset", String(retryAfterSec));

        if (entry.count > max) {
            res.setHeader("Retry-After", String(retryAfterSec));
            return next(new HttpError(429, code, message));
        }

        return next();
    };
}
