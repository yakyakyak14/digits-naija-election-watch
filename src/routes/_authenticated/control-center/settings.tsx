import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/control-center/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Your account.</p>
      </div>
      <Card className="p-6 space-y-2 text-sm">
        <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{user?.email}</span></div>
        <div><span className="text-muted-foreground">User ID:</span> <span className="font-mono text-xs">{user?.id}</span></div>
      </Card>
    </div>
  );
}
