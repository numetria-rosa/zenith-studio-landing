/* Short-lived in-memory cache for the "is this session entitled to this
   course" check the guarded course route (src/app/courses/[courseId]/
   [...path]/route.ts) runs on every single request — not just each page
   navigation, but every asset that page pulls (course-rail.js, css,
   course-progress.js, images, datasets), since they're all served through
   the same auth-gated route. Measured live: auth() (a DB session lookup)
   and hasCourseAccess() (a DB entitlement lookup) together cost 350-850ms
   per request in this environment, run sequentially because the second
   query needs the first's userId — a real, measured contributor to page
   navigation feeling slow, since a single page load fires this guard
   8-10+ times for its chrome alone.

   TTL is short deliberately: a revoked entitlement or an ended session
   should still take effect quickly, not be silently ignored for a long
   window. 20s bounds the staleness to "about one page's worth of asset
   requests can share a cache hit," not "a logged-out session keeps
   working for a while" — comparable in spirit to the 1hr HTTP cache
   already applied to the same static assets, just far more conservative
   because this gate is a security boundary and that one isn't. */

const TTL_MS = 20_000;
const MAX_ENTRIES = 5_000; // bound memory under unexpected traffic; evict oldest on overflow

type CacheEntry = { userId: string | null; entitled: boolean; expiresAt: number };

const cache = new Map<string, CacheEntry>();

function cacheKey(sessionToken: string, courseId: string): string {
  return `${sessionToken}:${courseId}`;
}

export function getCachedAccess(sessionToken: string, courseId: string): { userId: string | null; entitled: boolean } | null {
  const entry = cache.get(cacheKey(sessionToken, courseId));
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(cacheKey(sessionToken, courseId));
    return null;
  }
  return { userId: entry.userId, entitled: entry.entitled };
}

export function setCachedAccess(sessionToken: string, courseId: string, userId: string | null, entitled: boolean): void {
  if (cache.size >= MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) cache.delete(oldestKey);
  }
  cache.set(cacheKey(sessionToken, courseId), { userId, entitled, expiresAt: Date.now() + TTL_MS });
}
