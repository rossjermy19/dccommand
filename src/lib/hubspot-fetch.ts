/**
 * HubSpot API fetch wrappers with automatic rate limit (429) backoff/retry
 * and search endpoint throttling to comply with HubSpot's secondly limit.
 */

let lastSearchTimestamp = 0;
const SEARCH_INTERVAL_MS = 350; // HubSpot secondly search rate limit is 4/s; 350ms ensures max ~2.8/s

/**
 * Standard fetch wrapper that automatically catches 429 Rate Limit responses,
 * extracts Retry-After if provided, waits with exponential backoff, and retries.
 */
export async function hubspotFetch(
  url: string,
  options: RequestInit,
  retries = 3
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);

      if (res.status === 429) {
        if (attempt === retries) {
          console.error(`[HubSpot API] Exceeded max retries on rate limit (429) for ${url}`);
          return res;
        }

        const retryAfterHeader = res.headers.get('retry-after');
        const delayMs = retryAfterHeader
          ? parseInt(retryAfterHeader, 10) * 1000
          : Math.min(1000 * Math.pow(2, attempt) + Math.random() * 300, 4000);

        console.warn(`[HubSpot API] 429 Rate limited on ${url}. Retrying in ${delayMs}ms (attempt ${attempt + 1}/${retries})...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      return res;
    } catch (err: any) {
      if (attempt === retries) throw err;
      const delayMs = 500 * Math.pow(2, attempt);
      console.warn(`[HubSpot API] Network error on ${url}: ${err.message}. Retrying in ${delayMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return fetch(url, options);
}

/**
 * Dedicated fetch wrapper for HubSpot Search API (/crm/v3/objects/.../search).
 * Automatically throttles requests so they never exceed the secondly limit.
 */
export async function hubspotSearchFetch(
  url: string,
  options: RequestInit,
  retries = 3
): Promise<Response> {
  const now = Date.now();
  const timeSinceLast = now - lastSearchTimestamp;
  if (timeSinceLast < SEARCH_INTERVAL_MS) {
    const waitTime = SEARCH_INTERVAL_MS - timeSinceLast;
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }
  lastSearchTimestamp = Date.now();

  return hubspotFetch(url, options, retries);
}
