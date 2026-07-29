import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, LogOut, UserRound } from "lucide-react";
import { toast } from "sonner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ControlCenterSidebar } from "@/components/control-center/ControlCenterSidebar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { getMyRoles } from "@/lib/roles.functions";
import { supabase } from "@/integrations/supabase/client";
import { highestRoleLabel } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/control-center")({
  head: () => ({
    meta: [
      { title: "Command Center — DIGITs Election Watch" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ControlCenterLayout,
});

function ControlCenterLayout() {
  const { data: myRoles = ["viewer"] } = useSuspenseQuery({
    queryKey: ["my-roles-cc"],
    queryFn: () => getMyRoles(),
  });
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast.success("Signed out.");
    navigate({ to: "/", replace: true });
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <ControlCenterSidebar myRoles={myRoles} />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="glass sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b px-3 sm:px-4">
            <div className="flex min-w-0 items-center gap-2">
              <SidebarTrigger />
              <span className="truncate font-display text-sm font-bold">Command Center</span>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="hidden sm:inline-flex">
                {highestRoleLabel(myRoles)}
              </Badge>

              <ThemeToggle className="hidden sm:inline-flex" />

              <Button asChild size="sm" variant="ghost" className="hidden gap-1.5 md:inline-flex">
                <Link to="/live" target="_blank">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Public grid
                </Link>
              </Button>

              <Button asChild size="sm" variant="ghost" className="gap-1.5">
                <Link to="/account">
                  <UserRound className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Account</span>
                </Link>
              </Button>

              <Button size="sm" variant="ghost" onClick={() => void signOut()} className="gap-1.5">
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>

          {/* The global footer anchors the Command Center too. */}
          <SiteFooter />
        </div>
      </div>
    </SidebarProvider>
  );
}
