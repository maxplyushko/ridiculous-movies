export type User = {
  id: string;
  name: string;
  personalListPublic: boolean;
  role: "user" | "admin";
};