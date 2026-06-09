/**
 * Wrapper around fetch that automatically injects the
 * X-Anima-Access-Token header when NEXT_PUBLIC_ANIMA_ACCESS_TOKEN
 * is available.
 *
 * Use this instead of bare `fetch()` for all protected API calls.
 * Public endpoints like /api/textos can still use plain fetch.
 */
export async function animaFetch(
  url: string,
  init?: RequestInit
): Promise<Response> {
  const token =
    typeof window !== "undefined"
      ? (process.env.NEXT_PUBLIC_ANIMA_ACCESS_TOKEN ?? "")
      : "";

  const headers = new Headers(init?.headers);

  if (token) {
    headers.set("X-Anima-Access-Token", token);
  }

  return fetch(url, { ...init, headers });
}
