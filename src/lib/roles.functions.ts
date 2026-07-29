import { supabase } from "@/integrations/supabase/client";
import { ROLES, type AppRole } from "./roles";

export async function getMyRoles(): Promise<AppRole[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return ["viewer"];

  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  if (error) {
    console.error("getMyRoles error:", error.message);
    return ["viewer"];
  }
  const roles = (data ?? []).map((r) => r.role as AppRole);
  return roles.length > 0 ? roles : ["viewer"];
}

export async function listUsersWithRoles() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: rolesRows } = await supabase
    .from("user_roles")
    .select("user_id, role");

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name");

  const byUser = new Map<string, AppRole[]>();
  for (const r of rolesRows ?? []) {
    const arr = byUser.get(r.user_id) ?? [];
    arr.push(r.role as AppRole);
    byUser.set(r.user_id, arr);
  }
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));

  const usersList = Array.from(byUser.keys()).map((userId) => ({
    id: userId,
    email: userId === user.id ? user.email ?? "Admin User" : `user_${userId.slice(0, 6)}@digits.ng`,
    display_name: profileMap.get(userId) ?? (userId === user.id ? "Super Admin" : "Observer User"),
    created_at: new Date().toISOString(),
    roles: byUser.get(userId) ?? ["viewer"],
  }));

  return usersList;
}

export async function grantRole(data: { userId: string; role: AppRole }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthenticated");

  const { error } = await supabase
    .from("user_roles")
    .insert({ user_id: data.userId, role: data.role, granted_by: user.id });

  if (error && !error.message.includes("duplicate")) throw new Error(error.message);
  return { ok: true };
}

export async function revokeRole(data: { userId: string; role: AppRole }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthenticated");

  const { error } = await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", data.userId)
    .eq("role", data.role);

  if (error) throw new Error(error.message);
  return { ok: true };
}
