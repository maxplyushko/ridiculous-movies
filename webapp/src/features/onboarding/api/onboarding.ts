import { apiFetch } from "@/api/client.ts";

export type GroupResponse = {
  groupId: string;
  groupName: string;
  inviteCode: string | null;
};

export async function createGroup(name: string): Promise<GroupResponse> {
  return apiFetch<GroupResponse>("/api/groups", { method: "POST", body: { name } });
}

export async function joinGroup(code: string): Promise<GroupResponse> {
  return apiFetch<GroupResponse>("/api/groups/join", { method: "POST", body: { code } });
}

export async function getInviteLink(): Promise<{ inviteCode: string }> {
  return apiFetch<{ inviteCode: string }>("/api/groups/me/invite");
}
