import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ROLES, type AppRole } from "./roles";

const roleSchema = z.enum(ROLES as unknown as [AppRole, ...AppRole[]]);

export const getMyRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => r.role as AppRole);
  });

export const listUsersWithRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Only admins/super_admins can list
    const { data: myRoles } = await context.supabase
      .from("user_roles").select("role").eq("user_id", context.userId);
    const roles = (myRoles ?? []).map((r) => r.role as AppRole);
    if (!roles.includes("super_admin") && !roles.includes("admin")) {
      throw new Error("Forbidden");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: users, error: uerr } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (uerr) throw new Error(uerr.message);

    const { data: rolesRows, error: rerr } = await supabaseAdmin
      .from("user_roles").select("user_id, role");
    if (rerr) throw new Error(rerr.message);

    const { data: profiles } = await supabaseAdmin
      .from("profiles").select("id, display_name");

    const byUser = new Map<string, AppRole[]>();
    for (const r of rolesRows ?? []) {
      const arr = byUser.get(r.user_id) ?? [];
      arr.push(r.role as AppRole);
      byUser.set(r.user_id, arr);
    }
    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));

    return users.users.map((u) => ({
      id: u.id,
      email: u.email ?? "",
      display_name: profileMap.get(u.id) ?? null,
      created_at: u.created_at,
      roles: byUser.get(u.id) ?? [],
    }));
  });

const mutateSchema = z.object({ userId: z.string().uuid(), role: roleSchema });

export const grantRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => mutateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: myRoles } = await context.supabase
      .from("user_roles").select("role").eq("user_id", context.userId);
    const roles = (myRoles ?? []).map((r) => r.role as AppRole);
    const isSuper = roles.includes("super_admin");
    const isAdmin = roles.includes("admin");
    if (!isSuper && !isAdmin) throw new Error("Forbidden");
    // Only super_admin can grant super_admin or admin
    if ((data.role === "super_admin" || data.role === "admin") && !isSuper) {
      throw new Error("Only Super Admin can grant Admin or Super Admin");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.userId, role: data.role, granted_by: context.userId });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    return { ok: true };
  });

export const revokeRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => mutateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: myRoles } = await context.supabase
      .from("user_roles").select("role").eq("user_id", context.userId);
    const roles = (myRoles ?? []).map((r) => r.role as AppRole);
    const isSuper = roles.includes("super_admin");
    const isAdmin = roles.includes("admin");
    if (!isSuper && !isAdmin) throw new Error("Forbidden");
    if ((data.role === "super_admin" || data.role === "admin") && !isSuper) {
      throw new Error("Only Super Admin can revoke Admin or Super Admin");
    }
    if (data.role === "super_admin" && data.userId === context.userId) {
      throw new Error("You cannot revoke your own Super Admin role");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .eq("role", data.role);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
