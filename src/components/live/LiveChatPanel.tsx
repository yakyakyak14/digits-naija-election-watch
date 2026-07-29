import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { EyeOff, Lock, MessageSquare, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStreamComments } from "@/hooks/useStreamComments";
import { useViewer } from "@/hooks/useViewer";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function timeAgo(iso: string) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

/**
 * Public conversation attached to the live grid. Reading is open to everyone;
 * posting requires an account, which is the one place the platform asks a
 * visitor to sign in.
 */
export function LiveChatPanel({
  channel = "public-live",
  streamId,
  className,
}: {
  channel?: string;
  streamId?: string;
  className?: string;
}) {
  const { comments, loading, post, hide } = useStreamComments(channel);
  const { isSignedIn, isStaff, displayName, profile } = useViewer();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pinnedToBottom = useRef(true);

  // Only auto-scroll when the reader is already at the bottom, so scrolling back
  // through the thread isn't yanked away by new arrivals.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && pinnedToBottom.current) el.scrollTop = el.scrollHeight;
  }, [comments.length]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || sending) return;

    setSending(true);
    try {
      await post(draft, { name: displayName, avatar: profile?.avatar_url }, streamId);
      setDraft("");
      pinnedToBottom.current = true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not post your comment.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section
      className={cn(
        "flex h-full min-h-[26rem] flex-col overflow-hidden rounded-xl border bg-card shadow-plate",
        className,
      )}
      aria-label="Live viewer conversation"
    >
      <header className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <h2 className="flex items-center gap-2 font-display text-sm font-bold">
          <MessageSquare className="h-4 w-4 text-primary" />
          Live conversation
        </h2>
        <Badge variant="outline" className="text-[10px]">
          {comments.length} {comments.length === 1 ? "message" : "messages"}
        </Badge>
      </header>

      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          pinnedToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
        }}
        className="scroll-slim flex-1 space-y-3 overflow-y-auto px-4 py-3"
      >
        {loading && <p className="text-xs text-muted-foreground">Loading the conversation…</p>}

        {!loading && comments.length === 0 && (
          <p className="py-8 text-center text-xs text-muted-foreground">
            No messages yet. Be the first to comment on what you're watching.
          </p>
        )}

        {comments.map((comment) => (
          <article key={comment.id} className="group flex items-start gap-2.5">
            <span
              aria-hidden
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/12 text-[10px] font-bold text-primary"
            >
              {comment.author_avatar ? (
                <img
                  src={comment.author_avatar}
                  alt=""
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                initials(comment.author_name)
              )}
            </span>

            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-[11px]">
                <span className="truncate font-semibold text-foreground">
                  {comment.author_name}
                </span>
                {comment.is_pinned && (
                  <ShieldCheck
                    className="h-3 w-3 shrink-0 text-primary"
                    aria-label="Pinned by Command Center"
                  />
                )}
                <span className="shrink-0 text-muted-foreground">
                  {timeAgo(comment.created_at)}
                </span>
              </p>
              <p className="mt-0.5 text-xs leading-relaxed break-words text-foreground/90">
                {comment.body}
              </p>
            </div>

            {isStaff && (
              <button
                type="button"
                onClick={() =>
                  void hide(comment.id).catch((err: Error) => toast.error(err.message))
                }
                title="Hide this comment"
                aria-label="Hide this comment"
                className="shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
              >
                <EyeOff className="h-3.5 w-3.5" />
              </button>
            )}
          </article>
        ))}
      </div>

      {isSignedIn ? (
        <form onSubmit={submit} className="flex items-end gap-2 border-t bg-muted/30 p-3">
          <label htmlFor="live-comment" className="sr-only">
            Your comment
          </label>
          <textarea
            id="live-comment"
            rows={2}
            maxLength={500}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) void submit(e);
            }}
            placeholder="Comment on what you're watching…"
            className="scroll-slim min-h-[2.5rem] flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-xs outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/25"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!draft.trim() || sending}
            aria-label="Post comment"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/30 p-3">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            Watching is open to everyone. Sign in to comment.
          </p>
          <Button asChild size="sm" variant="outline">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      )}
    </section>
  );
}
