import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getMyRoles } from "@/lib/roles.functions";
import { BROADCAST_ROLES, CONTROL_CENTER_ROLES, hasAnyRole, type AppRole } from "@/lib/roles";
import { useAuth } from "./useAuth";
import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Deployment = Database["public"]["Tables"]["digeo_deployments"]["Row"];
export type Application = Database["public"]["Tables"]["digeo_applications"]["Row"];

/**
 * The signed-in viewer: session, profile, deployment, and roles resolved together.
 * Anyone with the 'digeo' role OR an assigned deployment OR an approved DIGEO application
 * is recognized as a DIGEO observer with live streaming capabilities.
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

  const deploymentQuery = useQuery({
    queryKey: ["my-deployment", userId],
    queryFn: async (): Promise<Deployment | null> => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("digeo_deployments")
        .select("*")
        .eq("observer_id", userId)
        .order("created_at", { ascending: false })
        .maybeSingle();
      if (error) return null;
      return data;
    },
    enabled: Boolean(userId),
    staleTime: 30_000,
  });

  const applicationQuery = useQuery({
    queryKey: ["my-digeo-application", userId],
    queryFn: async (): Promise<Application | null> => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("digeo_applications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .maybeSingle();
      if (error) return null;
      return data;
    },
    enabled: Boolean(userId),
    staleTime: 30_000,
  });

  const roles: AppRole[] = userId ? (rolesQuery.data ?? []) : [];
  const profile = profileQuery.data ?? null;
  const deployment = deploymentQuery.data ?? null;
  const application = applicationQuery.data ?? null;

  const hasDigeoRole = roles.includes("digeo");
  const isApprovedApp = application?.status === "approved";
  const hasDeployment = Boolean(deployment);
  const isObserver = hasDigeoRole || isApprovedApp || hasDeployment;

  return {
    user,
    userId,
    profile,
    deployment,
    application,
    roles,
    loading:
      sessionLoading || (Boolean(userId) && (rolesQuery.isLoading || profileQuery.isLoading)),
    isSignedIn: Boolean(user),
    isSuperAdmin: roles.includes("super_admin"),
    isAdmin: roles.includes("super_admin") || roles.includes("admin"),
    isStaff: hasAnyRole(roles, CONTROL_CENTER_ROLES),
    isBroadcastOperator: hasAnyRole(roles, BROADCAST_ROLES),
    isObserver,
    hasDeployment,
    /** i-Witness submission requires a verified identity on file. */
    hasNin: Boolean(profile?.nin),
    displayName:
      profile?.display_name ||
      user?.user_metadata?.full_name ||
      user?.email?.split("@")[0] ||
      "Citizen",
    refetchProfile: profileQuery.refetch,
    refetchDeployment: deploymentQuery.refetch,
  };
}
