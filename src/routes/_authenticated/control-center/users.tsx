import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { X, Plus, ShieldAlert } from "lucide-react";
import { getMyRoles, listUsersWithRoles, grantRole, revokeRole } from "@/lib/roles.functions";
import { ROLE_META, ROLES, type AppRole } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/control-center/users")({
  component: UsersPage,
});

function UsersPage() {
  const qc = useQueryClient();

  const { data: myRoles = ["viewer"] } = useSuspenseQuery({
    queryKey: ["my-roles"],
    queryFn: () => getMyRoles(),
  });
  const isSuper = myRoles.includes("super_admin");
  const isAdmin = myRoles.includes("admin");
  const canManage = isSuper || isAdmin;

  const { data: users, error } = useSuspenseQuery({
    queryKey: ["cc-users"],
    queryFn: () => canManage ? listUsersWithRoles() : Promise.resolve([]),
  });

  const [q, setQ] = useState("");
  const [selectedRole, setSelectedRole] = useState<Record<string, AppRole>>({});

  const grantM = useMutation({
    mutationFn: (v: { userId: string; role: AppRole }) => grantRole(v),
    onSuccess: () => {
      toast.success("Role granted");
      qc.invalidateQueries({ queryKey: ["cc-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revokeM = useMutation({
    mutationFn: (v: { userId: string; role: AppRole }) => revokeRole(v),
    onSuccess: () => {
      toast.success("Role revoked");
      qc.invalidateQueries({ queryKey: ["cc-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!canManage) {
    return (
      <Card className="mx-auto max-w-2xl p-8 text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-destructive" />
        <div className="mt-3 font-display text-lg font-semibold">Restricted</div>
        <p className="mt-1 text-sm text-muted-foreground">
          Only Admin or Super Admin can manage users & roles.
        </p>
      </Card>
    );
  }

  const filtered = (users ?? []).filter((u) =>
    !q || u.email.toLowerCase().includes(q.toLowerCase()) || (u.display_name ?? "").toLowerCase().includes(q.toLowerCase())
  );

  const assignableRoles: AppRole[] = isSuper
    ? [...ROLES]
    : ROLES.filter((r) => r !== "super_admin" && r !== "admin");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Users & Roles</h1>
        <p className="text-sm text-muted-foreground">
          {isSuper ? "As Super Admin, you can grant any role." : "As Admin, you can grant every role except Admin and Super Admin."}
        </p>
      </div>

      <Input placeholder="Search by email or name…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />

      {error && <Card className="p-4 text-sm text-destructive">{(error as Error).message}</Card>}

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead className="w-[280px]">Grant role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="font-medium">{u.display_name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {u.roles.length === 0 && <Badge variant="outline">viewer (default)</Badge>}
                    {u.roles.map((r) => {
                      const canRevoke = isSuper || (r !== "super_admin" && r !== "admin");
                      return (
                        <Badge key={r} variant={r === "super_admin" ? "default" : "secondary"} className="gap-1">
                          {ROLE_META[r].label}
                          {canRevoke && (
                            <button
                              className="ml-1 opacity-70 hover:opacity-100"
                              onClick={() => revokeM.mutate({ userId: u.id, role: r })}
                              aria-label={`Revoke ${r}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </Badge>
                      );
                    })}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Select
                      value={selectedRole[u.id] ?? ""}
                      onValueChange={(v) => setSelectedRole({ ...selectedRole, [u.id]: v as AppRole })}
                    >
                      <SelectTrigger className="h-8"><SelectValue placeholder="Role…" /></SelectTrigger>
                      <SelectContent>
                        {assignableRoles.map((r) => (
                          <SelectItem key={r} value={r} disabled={u.roles.includes(r)}>{ROLE_META[r].label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      disabled={!selectedRole[u.id] || grantM.isPending}
                      onClick={() => grantM.mutate({ userId: u.id, role: selectedRole[u.id]! })}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
