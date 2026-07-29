import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Radio, Users2, FileWarning, GraduationCap, ShieldCheck, Settings, Eye } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import type { AppRole } from "@/lib/roles";
import { hasAnyRole } from "@/lib/roles";

type Item = { title: string; url: string; icon: React.ComponentType<{ className?: string }>; allowed: AppRole[]; badge?: string };

const items: Item[] = [
  { title: "Overview", url: "/control-center", icon: LayoutDashboard, allowed: ["super_admin","admin","control_center_operator","observer_coordinator","reviewer","digeo","viewer"] },
  { title: "Live Streams", url: "/control-center/live", icon: Radio, allowed: ["super_admin","admin","control_center_operator"], badge: "Video" },
  { title: "Observers", url: "/control-center/observers", icon: Users2, allowed: ["super_admin","admin","observer_coordinator"] },
  { title: "Incident Reports", url: "/control-center/reports", icon: FileWarning, allowed: ["super_admin","admin","reviewer","control_center_operator"] },
  { title: "Training", url: "/control-center/training", icon: GraduationCap, allowed: ["super_admin","admin","observer_coordinator","digeo","viewer"] },
  { title: "Users & Roles", url: "/control-center/users", icon: ShieldCheck, allowed: ["super_admin","admin"], badge: "Admin" },
  { title: "Public Viewer", url: "/control-center/public", icon: Eye, allowed: ["super_admin","admin","control_center_operator","observer_coordinator","reviewer","digeo","viewer"] },
  { title: "Settings", url: "/control-center/settings", icon: Settings, allowed: ["super_admin","admin","control_center_operator","observer_coordinator","reviewer","digeo","viewer"] },
];

export function ControlCenterSidebar({ myRoles }: { myRoles: AppRole[] }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b p-3">
        <Link to="/" className="flex items-center gap-2 font-display font-bold">
          <img src="/favicon.svg" alt="DIGITs Logo" className="h-6 w-6" />
          {!collapsed && <span className="text-foreground">DIGITs Nigeria</span>}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Control Center</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = pathname === item.url || (item.url !== "/control-center" && pathname.startsWith(item.url));
                const allowed = hasAnyRole(myRoles, item.allowed);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild={allowed}
                      isActive={active}
                      disabled={!allowed}
                      tooltip={!allowed ? `Requires: ${item.allowed.join(", ")}` : item.title}
                    >
                      {allowed ? (
                        <Link to={item.url} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span className="flex-1">{item.title}</span>}
                          {!collapsed && item.badge && <Badge variant="outline" className="text-[10px]">{item.badge}</Badge>}
                        </Link>
                      ) : (
                        <div className="flex items-center gap-2 opacity-50">
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span className="flex-1">{item.title}</span>}
                          {!collapsed && <Badge variant="outline" className="text-[10px]">Locked</Badge>}
                        </div>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-3 text-[10px] text-muted-foreground space-y-1">
        {!collapsed && (
          <>
            <div>v1.0 · DIGITs Nigeria 🇳🇬</div>
            <div>Built by <strong className="font-bold text-emerald-600 dark:text-emerald-400 animate-float">SirHope</strong> of <strong className="font-bold text-amber-500 animate-float-delay">WYN-Tech</strong></div>
          </>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
