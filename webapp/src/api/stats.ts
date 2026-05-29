import {apiFetch} from "./client.ts";
import type {Stats} from "../types/Stat.ts";

const BASE = "/api/stats"

export async function fetchStats(sort: "asc" | "desc" = "desc") {
  return apiFetch<Stats>(`${BASE}?sort=${sort}`, {})
}
