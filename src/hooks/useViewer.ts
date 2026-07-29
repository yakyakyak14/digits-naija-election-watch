import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getMyRoles } from "@/lib/roles.functions";
import { BROADCAST_ROLES, CONTROL_CENTER_ROLES, hasAnyRole, type AppRole } from "@/lib/roles";
import { useAuth } from "./useAuth";
import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * The signed-in viewer: session, profile and roles resolved together, with the
 * capability flags the UI actually branches on. Anonymous visitors get a fully
 * populated object with empty roles — every public feature reads the same shape.
 */
export function useViewer() {
  const { user, loading: sessionLoading } = useAuth();
  const userId = user?.id;

  const rolesQuery = useQuery({
    queryKey: ["my-roles", userId],
    queryFn: getMyRoles,
    enabled: Boolean(userId),
    staleTime: 60_000,
  });

  const profileQuery = useQuery({
    queryKey: ["my-profile", userId],
    queryFn: async (): Promise<Profile | null> => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: Boolean(userId),
    staleTime: 30_000,
  });

  const roles: AppRole[] = userId ? (rolesQuery.data ?? []) : [];
  const profile = profileQuery.data ?? null;

  return {
    user,
    userId,
    profile,
    roles,
    loading:
      sessionLoading || (Boolean(userId) && (rolesQuery.isLoading || profileQuery.isLoading)),
    isSignedIn: Boolean(user),
    isSuperAdmin: roles.includes("super_admin"),
    isAdmin: roles.includes("super_admin") || roles.includes("admin"),
    isStaff: hasAnyRole(roles, CONTROL_CENTER_ROLES),
    isBroadcastOperator: hasAnyRole(roles, BROADCAST_ROLES),
    isObserver: roles.includes("digeo"),
    /** i-Witness submission requires a verified identity on file. */
    hasNin: Boolean(profile?.nin),
    displayName:
      profile?.display_name ||
      user?.user_metadata?.full_name ||
      user?.email?.split("@")[0] ||
      "Citizen",
    refetchProfile: profileQuery.refetch,
  };
}
