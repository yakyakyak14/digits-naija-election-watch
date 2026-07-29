import { Link, useRouterState } from "@tanstack/react-router";
import {
  ClipboardList,
  Eye,
  FileWarning,
  GraduationCap,
  LayoutDashboard,
  Radio,
  ScrollText,
  Settings,
  ShieldCheck,
  Siren,
  Users2,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { DigitsMark } from "@/components/brand/DigitsLogo";
import { hasAnyRole, ROLE_META, type AppRole } from "@/lib/roles";

type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  allowed: AppRole[];
  badge?: string;
  group: "Operations" | "Network" | "Account";
};

const ALL: AppRole[] = [
  "super_admin",
  "admin",
  "control_center_operator",
  "observer_coordinator",
  "reviewer",
  "digeo",
  "viewer",
];

const ITEMS: NavItem[] = [
  {
    title: "Overview",
    url: "/control-center",
    icon: LayoutDashboard,
    allowed: ALL,
    group: "Operations",
  },
  {
    title: "Live operations",
    url: "/control-center/live",
    icon: Radio,
    allowed: ["super_admin", "admin", "control_center_operator", "digeo"],
    badge: "Video",
    group: "Operations",
  },
  {
    title: "i-Witness queue",
    url: "/control-center/reports",
    icon: FileWarning,
    allowed: ["super_admin", "admin", "control_center_operator", "reviewer"],
    group: "Operations",
  },
  {
    title: "Incidents",
    url: "/control-center/incidents",
    icon: Siren,
    allowed: [
      "super_admin",
      "admin",
      "control_center_operator",
      "reviewer",
      "observer_coordinator",
    ],
    group: "Operations",
  },
  {
    title: "Public preview",
    url: "/control-center/public",
    icon: Eye,
    allowed: ALL,
    group: "Operations",
  },
  {
    title: "Observers",
    url: "/control-center/observers",
    icon: Users2,
    allowed: ["super_admin", "admin", "observer_coordinator"],
    group: "Network",
  },
  {
    title: "Field forms",
    url: "/control-center/field",
    icon: ClipboardList,
    allowed: ["super_admin", "admin", "observer_coordinator", "digeo"],
    group: "Network",
  },
  {
    title: "DIGEO academy",
    url: "/control-center/training",
    icon: GraduationCap,
    allowed: ALL,
    group: "Network",
  },
  {
    title: "Users & roles",
    url: "/control-center/users",
    icon: ShieldCheck,
    allowed: ["super_admin", "admin"],
    badge: "Admin",
    group: "Account",
  },
  {
    title: "Audit trail",
    url: "/control-center/audit",
    icon: ScrollText,
    allowed: [
      "super_admin",
      "admin",
      "control_center_operator",
      "observer_coordinator",
      "reviewer",
    ],
    group: "Account",
  },
  {
    title: "Settings",
    url: "/control-center/settings",
    icon: Settings,
    allowed: ALL,
    group: "Account",
  },
];

const GROUPS = ["Operations", "Network", "Account"] as const;

export function ControlCenterSidebar({ myRoles }: { myRoles: AppRole[] }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-3">
        <Link to="/" className="flex items-center gap-2.5" aria-label="DIGITs Election Watch home">
          <DigitsMark size={30} priority />
          {!collapsed && (
            <span className="min-w-0 leading-tight">
              <span className="block font-display text-sm font-extrabold">DIGITs</span>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-brand-gold">
                Command Center
              </span>
            </span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="scroll-slim">
        {GROUPS.map((group) => (
          <SidebarGroup key={group}>
            <SidebarGroupLabel>{group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {ITEMS.filter((item) => item.group === group).map((item) => {
                  const active =
                    pathname === item.url ||
                    (item.url !== "/control-center" && pathname.startsWith(item.url));
                  const allowed = hasAnyRole(myRoles, item.allowed);

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild={allowed}
                        isActive={active}
                        disabled={!allowed}
                        tooltip={
                          allowed
                            ? item.title
                            : `Needs: ${item.allowed.map((r) => ROLE_META[r].label).join(", ")}`
                        }
                      >
                        {allowed ? (
                          <Link to={item.url} className="flex items-center gap-2">
                            <item.icon className="h-4 w-4" />
                            {!collapsed && <span className="flex-1 truncate">{item.title}</span>}
                            {!collapsed && item.badge && (
                              <Badge variant="outline" className="text-[9px]">
                                {item.badge}
                              </Badge>
                            )}
                          </Link>
                        ) : (
                          <div className="flex items-center gap-2 opacity-45">
                            <item.icon className="h-4 w-4" />
                            {!collapsed && <span className="flex-1 truncate">{item.title}</span>}
                            {!collapsed && (
                              <Badge variant="outline" className="text-[9px]">
                                Locked
                              </Badge>
                            )}
                          </div>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="space-y-1 border-t border-sidebar-border p-3 text-[10px] text-sidebar-foreground/60">
        {!collapsed && (
          <>
            <div>DIGITs Election Watch · v2</div>
            <div>
              Built by{" "}
              <strong className="animate-float font-extrabold text-brand-green-bright">
                SirHope
              </strong>{" "}
              of{" "}
              <strong className="animate-float-delay font-extrabold text-brand-gold">
                WYN-Tech
              </strong>
            </div>
          </>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
