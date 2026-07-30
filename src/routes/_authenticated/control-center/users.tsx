import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Loader2, Plus, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, PageHeader, Restricted } from "@/components/control-center/PageHeader";
import { RoleReferenceSlides } from "@/components/control-center/RoleReferenceSlides";
import { useViewer } from "@/hooks/useViewer";
import { grantRole, listUsersWithRoles, revokeRole } from "@/lib/roles.functions";
import { ROLE_META, ROLES, type AppRole } from "@/lib/roles";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/control-center/users")({
  component: UsersPage,
});

function UsersPage() {
  const { isAdmin, isSuperAdmin, userId } = useViewer();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<Record<string, AppRole>>({});

  const users = useQuery({
    queryKey: ["cc-users"],
    queryFn: listUsersWithRoles,
    enabled: isAdmin,
  });

  const grant = useMutation({
    mutationFn: grantRole,
    onSuccess: () => {
      toast.success("Role granted.");
      qc.invalidateQueries({ queryKey: ["cc-users"] });
      qc.invalidateQueries({ queryKey: ["cc-audit"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const revoke = useMutation({
    mutationFn: revokeRole,
    onSuccess: () => {
      toast.success("Role revoked.");
      qc.invalidateQueries({ queryKey: ["cc-users"] });
      qc.invalidateQueries({ queryKey: ["cc-audit"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const filtered = useMemo(() => {
    const rows = users.data ?? [];
    if (!search.trim()) return rows;
    const needle = search.toLowerCase();
    return rows.filter(
      (u) =>
        u.email.toLowerCase().includes(needle) ||
        u.display_name.toLowerCase().includes(needle) ||
        (u.state ?? "").toLowerCase().includes(needle),
    );
  }, [users.data, search]);

  // Mirrors the database rule: an Admin can grant everything except Admin and
  // Super Admin. The RPC rejects it anyway, but the UI shouldn't offer it.
  const assignable: AppRole[] = isSuperAdmin
    ? [...ROLES]
    : ROLES.filter((role) => role !== "super_admin" && role !== "admin");

  if (!isAdmin) return <Restricted need="Admin or Super Admin" />;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Users & roles"
        description={
          isSuperAdmin
            ? "As Super Admin you can grant any role. The last Super Admin cannot be removed — the database blocks it."
            : "As Admin you can grant every role except Admin and Super Admin. That limit is enforced in the database, not just here."
        }
        actions={
          <Button
            size="sm"
            variant="outline"
            onClick={() => void users.refetch()}
            className="gap-1.5"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", users.isFetching && "animate-spin")} />
            Refresh
          </Button>
        }
      />

      <div className="w-full sm:max-w-sm">
        <label htmlFor="user-search" className="sr-only">
          Search users
        </label>
        <Input
          id="user-search"
          placeholder="Search name, email or state…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {users.isLoading && <p className="text-sm text-muted-foreground">Loading the roster…</p>}

      {users.error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {(users.error as Error).message}
        </p>
      )}

      {!users.isLoading && filtered.length === 0 && (
        <EmptyState
          icon={BadgeCheck}
          title="No accounts match"
          body="Try a different name, email or state."
        />
      )}

      {filtered.length > 0 && (
        <div className="plate overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Locality</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead className="w-68">Grant a role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-1.5 font-medium">
                      {user.display_name}
                      {user.id === userId && (
                        <Badge variant="outline" className="text-[9px]">
                          You
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">
                      {user.last_sign_in_at
                        ? `Last seen ${new Date(user.last_sign_in_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}`
                        : "Never signed in"}
                    </div>
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    {[user.lga, user.state].filter(Boolean).join(", ") || "—"}
                    {user.nin_verified && (
                      <Badge className="mt-1 flex w-fit gap-1 bg-primary/15 text-[9px] text-primary">
                        <BadgeCheck className="h-2.5 w-2.5" />
                        NIN
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.length === 0 && <Badge variant="outline">viewer (default)</Badge>}
                      {user.roles.map((role) => {
                        const canRevoke =
                          isSuperAdmin || (role !== "super_admin" && role !== "admin");
                        return (
                          <Badge
                            key={role}
                            variant={role === "super_admin" ? "default" : "secondary"}
                            className="gap-1"
                          >
                            {ROLE_META[role].label}
                            {canRevoke && (
                              <button
                                type="button"
                                className="ml-0.5 opacity-70 transition-opacity hover:opacity-100"
                                onClick={() => revoke.mutate({ userId: user.id, role })}
                                aria-label={`Revoke ${ROLE_META[role].label} from ${user.display_name}`}
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
                        value={pending[user.id] ?? ""}
                        onValueChange={(value) =>
                          setPending({ ...pending, [user.id]: value as AppRole })
                        }
                      >
                        <SelectTrigger
                          className="h-8"
                          aria-label={`Role to grant ${user.display_name}`}
                        >
                          <SelectValue placeholder="Choose a role…" />
                        </SelectTrigger>
                        <SelectContent>
                          {assignable.map((role) => (
                            <SelectItem
                              key={role}
                              value={role}
                              disabled={user.roles.includes(role)}
                            >
                              {ROLE_META[role].label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        size="sm"
                        disabled={!pending[user.id] || grant.isPending}
                        onClick={() => grant.mutate({ userId: user.id, role: pending[user.id]! })}
                        aria-label={`Grant role to ${user.display_name}`}
                      >
                        {grant.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Plus className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <RoleReferenceSlides />
    </div>
  );
}
