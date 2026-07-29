export const ROLES = [
  "super_admin",
  "admin",
  "control_center_operator",
  "observer_coordinator",
  "digeo",
  "reviewer",
  "viewer",
] as const;

export type AppRole = (typeof ROLES)[number];

export const ROLE_META: Record<
  AppRole,
  { label: string; description: string; capabilities: string[] }
> = {
  super_admin: {
    label: "Super Admin",
    description: "Full platform control. Only one or two people should hold this role.",
    capabilities: [
      "Grant or revoke any role including Admin",
      "Full access to Control Center",
      "Approve live public broadcasts",
      "Manage platform settings",
    ],
  },
  admin: {
    label: "Admin",
    description: "Day-to-day platform administration.",
    capabilities: [
      "Grant most roles (except Super Admin)",
      "Full access to Control Center",
      "Approve reports and moderate content",
    ],
  },
  control_center_operator: {
    label: "Control Center Operator",
    description: "Runs the live broadcast console during elections.",
    capabilities: [
      "View all live observer streams",
      "Pick which streams (1–6 tiles) go public",
      "Escalate incidents to Admin",
    ],
  },
  observer_coordinator: {
    label: "Observer Coordinator",
    description: "Manages the DIGEO observer network.",
    capabilities: [
      "Review DIGEO training submissions",
      "Assign observers to polling units",
      "Message assigned observers",
    ],
  },
  digeo: {
    label: "DIGEO (Trained Observer)",
    description: "DIGITS-trained Election Observer in the field.",
    capabilities: [
      "Submit incident reports with evidence",
      "Broadcast live from assigned polling unit",
      "Access observer training materials",
    ],
  },
  reviewer: {
    label: "Reviewer",
    description: "Verifies incoming reports before publication.",
    capabilities: ["Review incident reports queue", "Mark reports as verified or rejected"],
  },
  viewer: {
    label: "Viewer",
    description: "Default role. Public transparency access only.",
    capabilities: ["View published live streams", "View verified reports and results"],
  },
};

/** Roles that grant Control Center access. Mirrors public.is_staff() in the database. */
export const CONTROL_CENTER_ROLES: AppRole[] = [
  "super_admin",
  "admin",
  "control_center_operator",
  "observer_coordinator",
  "reviewer",
];

/** Roles that may curate the public 1–6 grid. Mirrors public.is_broadcast_operator(). */
export const BROADCAST_ROLES: AppRole[] = ["super_admin", "admin", "control_center_operator"];

/** Roles that may broadcast a camera into the Command Center. */
export const PUBLISHER_ROLES: AppRole[] = [...BROADCAST_ROLES, "digeo"];

export function hasAnyRole(userRoles: AppRole[], allowed: AppRole[]): boolean {
  return userRoles.some((r) => allowed.includes(r));
}

export function highestRoleLabel(userRoles: AppRole[]): string {
  const order: AppRole[] = [
    "super_admin",
    "admin",
    "control_center_operator",
    "observer_coordinator",
    "reviewer",
    "digeo",
    "viewer",
  ];
  for (const r of order) if (userRoles.includes(r)) return ROLE_META[r].label;
  return "Viewer";
}
