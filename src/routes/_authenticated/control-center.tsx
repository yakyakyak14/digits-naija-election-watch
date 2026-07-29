import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ControlCenterSidebar } from "@/components/control-center/ControlCenterSidebar";
import { getMyRoles } from "@/lib/roles.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { highestRoleLabel } from "@/lib/roles";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/control-center")({
  component: ControlCenterLayout,
});

function ControlCenterLayout() {
  const { data: myRoles = ["viewer"] } = useSuspenseQuery({
    queryKey: ["my-roles"],
    queryFn: () => getMyRoles(),
  });
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <ControlCenterSidebar myRoles={myRoles} />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <div className="font-display font-semibold">Control Center</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="hidden sm:inline-flex">{highestRoleLabel(myRoles)}</Badge>
              <Button size="sm" variant="ghost" onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
