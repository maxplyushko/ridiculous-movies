import {PRIVATE_USE_MESSAGE} from "./messages.ts";
import { getTelegramId } from "./telegram.ts";

type RequestOptions = {
  method?: string;
  body?: unknown;
};

function parseErrorMessage(text: string, status: number): string {
  if (!text) {
    return status === 403 ? PRIVATE_USE_MESSAGE : `HTTP ${status}`;
  }
  try {
    const json = JSON.parse(text) as { message?: string; error?: string };
    if (json.message) {
      return json.message;
    }
    if (status === 403) {
      return PRIVATE_USE_MESSAGE;
    }
    if (json.error) {
      return json.error;
    }
  } catch {
    // plain text response
  }
  return text;
}

export async function apiFetch<T>(path: string, {method, body}: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  headers["User-Id"] = getTelegramId();
  const response = await fetch(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(parseErrorMessage(text, response.status));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function ping(signal?: AbortSignal): Promise<void> {
  const res = await fetch("/api/start", {signal});
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  if (body.status !== "ok") throw new Error("unexpected response");
}
