const TOKEN_KEY = "rm_access_token";
const LOGGED_OUT_KEY = "rm_logged_out";

export const tokenStore = {
  get: () => sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY),
  set: (token: string) => {
    localStorage.removeItem(LOGGED_OUT_KEY);
    localStorage.setItem(TOKEN_KEY, token);
  },
  setSession: (token: string) => {
    localStorage.removeItem(LOGGED_OUT_KEY);
    sessionStorage.setItem(TOKEN_KEY, token);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  },
  markLoggedOut: () => {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.setItem(LOGGED_OUT_KEY, "1");
  },
  isLoggedOut: () => localStorage.getItem(LOGGED_OUT_KEY) === "1",
};

type RequestOptions = {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
};

function parseErrorMessage(text: string, status: number): string {
  if (!text) return `Error: ${status}`;
  try {
    const json = JSON.parse(text) as { message?: string; error?: string };
    if (json.message) return json.message;
    if (json.error) return json.error;
  } catch { /* empty */ }
  return text;
}

export async function apiFetch<T>(path: string, {method, body, signal}: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  const token = tokenStore.get();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const response = await fetch(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
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
