import { useEffect, useState } from "react";
import { Download, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DigitsMark } from "@/components/brand/DigitsLogo";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "digits-install-dismissed";

/**
 * Registers the service worker and offers an install affordance when the browser
 * says the app is installable. Dismissal is remembered for 30 days — a
 * transparency tool should not nag.
 */
export function InstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* offline support is a bonus, never a blocker */
      });
    }

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    const recentlyDismissed = Date.now() - dismissedAt < 30 * 24 * 3600 * 1000;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
      if (!recentlyDismissed) setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }

  async function install() {
    if (!event) return;
    await event.prompt();
    const choice = await event.userChoice;
    if (choice.outcome === "accepted") setVisible(false);
    else dismiss();
  }

  if (!visible || !event) return null;

  return (
    <aside
      aria-label="Install DIGITs"
      className="glass fixed inset-x-3 bottom-3 z-40 flex items-center gap-3 rounded-xl border p-3 shadow-lifted sm:left-auto sm:right-4 sm:w-96"
    >
      <DigitsMark size={40} />

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-xs font-bold">
          <Smartphone className="h-3.5 w-3.5 text-primary" />
          Install DIGITs
        </p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
          Add it to your home screen for one-tap access to the live grid and i-Witness reporting.
        </p>
      </div>

      <div className="flex shrink-0 flex-col gap-1">
        <Button size="sm" onClick={() => void install()} className="h-7 gap-1 px-2 text-[11px]">
          <Download className="h-3 w-3" />
          Install
        </Button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="self-end rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </aside>
  );
}
