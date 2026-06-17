// Rate limiter in-memory a finestra fissa, per IP+chiave.
//
// NOTA: lo stato vive nel processo. Su serverless (Vercel) ogni istanza ha la
// propria memoria e gli stati non sono condivisi tra lambda, quindi questo è un
// limite "best effort" anti-abuso, non una garanzia rigida. Quando servirà un
// rate limit robusto distribuito, sostituire con Upstash Redis / @vercel/kv
// mantenendo la stessa firma `rateLimit()`.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(key: string, limit = 60, windowMs = 60_000): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, resetAt };
  }

  bucket.count += 1;
  const remaining = Math.max(0, limit - bucket.count);
  return { ok: bucket.count <= limit, remaining, resetAt: bucket.resetAt };
}

// Estrae un identificativo client dagli header standard dei proxy.
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
