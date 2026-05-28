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