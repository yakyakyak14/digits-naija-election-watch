import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "./roles";

export interface PlatformUser {
  id: string;
  email: string;
  display_name: string;
  state: string | null;
  lga: string | null;
  nin_verified: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  roles: AppRole[];
}

export async function getMyRoles(): Promise<AppRole[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  if (error) {
    console.error("getMyRoles:", error.message);
    return ["viewer"];
  }

  const roles = (data ?? []).map((r) => r.role as AppRole);
  return roles.length > 0 ? roles : ["viewer"];
}

/**
 * Staff-only roster. Backed by `list_platform_users()`, a SECURITY DEFINER
 * function that joins auth.users to profiles — real emails and sign-in times
 * rather than the placeholders the client used to invent.
 */
export async function listUsersWithRoles(): Promise<PlatformUser[]> {
  const { data, error } = await supabase.rpc("list_platform_users");
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    email: row.email ?? "—",
    display_name: row.display_name ?? "—",
    state: row.state,
    lga: row.lga,
    nin_verified: row.nin_verified ?? false,
    created_at: row.created_at,
    last_sign_in_at: row.last_sign_in_at,
    roles: (row.roles ?? []) as AppRole[],
  }));
}

/**
 * Grant and revoke go through RPCs, so the "Admins cannot mint Admins" rule and
 * the audit trail are enforced in the database rather than in the UI.
 */
export async function grantRole({ userId, role }: { userId: string; role: AppRole }) {
  const { error } = await supabase.rpc("grant_user_role", { _user_id: userId, _role: role });
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function revokeRole({ userId, role }: { userId: string; role: AppRole }) {
  const { error } = await supabase.rpc("revoke_user_role", { _user_id: userId, _role: role });
  if (error) throw new Error(error.message);
  return { ok: true };
}

/** Fire-and-forget audit entry for actions worth reconstructing after the fact. */
export async function writeAudit(entry: {
  action: string;
  entity: string;
  entityId?: string;
  detail?: Record<string, unknown>;
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("audit_log").insert({
    actor_id: user.id,
    actor_label: user.email ?? null,
    action: entry.action,
    entity: entry.entity,
    entity_id: entry.entityId ?? null,
    detail: (entry.detail ?? {}) as never,
  });
}
