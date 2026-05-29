import type {User} from "../types/User";
import {apiFetch} from "./client";

export async function fetchUsers(): Promise<User[]> {
  return apiFetch<User[]>("/api/users");
}