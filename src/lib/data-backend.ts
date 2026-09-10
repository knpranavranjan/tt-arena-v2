/**
 * Shared switch + fetch helpers for the context stores.
 *
 * `USE_DB` is true only when `NEXT_PUBLIC_DATA_BACKEND=db`. Anything else (unset
 * included) keeps every store on its original localStorage path, so the app
 * runs with no database exactly as it did before this work.
 */
export const USE_DB = process.env.NEXT_PUBLIC_DATA_BACKEND === "db";

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return (await res.json()) as T;
}

export async function apiSend<T = unknown>(
  path: string,
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  body?: unknown,
): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}`);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
