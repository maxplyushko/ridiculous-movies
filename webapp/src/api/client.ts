import {getTelegramUserId} from "./telegram.ts";

type RequestOptions = {
  method?: string;
  body?: unknown;
};

export async function apiFetch<T>(path: string, { method, body }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  headers["User-Id"] = getTelegramUserId();
  const response = await fetch(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

const PING_INTERVAL_MS = 4_000;
const PING_TIMEOUT_MS = 20_000;
const MAX_PING_ATTEMPTS = 75;

export async function ping(signal?: AbortSignal): Promise<void> {
  const res = await fetch("/api/start", { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  if (body.status !== "ok") throw new Error("unexpected response");
}

export async function waitForServer(
  onAttempt?: (attempt: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  for (let attempt = 1; attempt <= MAX_PING_ATTEMPTS; attempt++) {
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }
    onAttempt?.(attempt);
    try {
      await ping(AbortSignal.timeout(PING_TIMEOUT_MS));
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, PING_INTERVAL_MS));
    }
  }
  throw new Error("Server did not respond in time");
}