import { useCallback, useEffect, useId, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type StreamComment = Database["public"]["Tables"]["stream_comments"]["Row"];

const PAGE_SIZE = 60;

/**
 * Live comment thread. Anyone — signed in or not — reads it; posting requires an
 * account. New messages arrive over a single Realtime channel rather than
 * polling, and the local list is capped so a busy election day cannot grow the
 * DOM without bound.
 */
export function useStreamComments(channel = "public-live") {
  // Unique realtime topic per panel instance — see useLiveStreams for why.
  const topic = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [comments, setComments] = useState<StreamComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const { data, error: loadError } = await supabase
        .from("stream_comments")
        .select("*")
        .eq("channel", channel)
        .eq("is_hidden", false)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);

      if (cancelled) return;
      if (loadError) setError(loadError.message);
      else setComments((data ?? []).reverse());
      setLoading(false);
    })();

    const realtime = supabase
      .channel(`stream-comments-${channel}-${topic}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "stream_comments",
          filter: `channel=eq.${channel}`,
        },
        (payload) => {
          const row = payload.new as StreamComment;
          if (row.is_hidden) return;
          setComments((prev) =>
            prev.some((c) => c.id === row.id) ? prev : [...prev, row].slice(-PAGE_SIZE),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "stream_comments",
          filter: `channel=eq.${channel}`,
        },
        (payload) => {
          const row = payload.new as StreamComment;
          setComments((prev) =>
            row.is_hidden
              ? prev.filter((c) => c.id !== row.id)
              : prev.map((c) => (c.id === row.id ? row : c)),
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "stream_comments" },
        (payload) => {
          const removed = payload.old as Partial<StreamComment>;
          setComments((prev) => prev.filter((c) => c.id !== removed.id));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(realtime);
    };
  }, [channel, topic]);

  const post = useCallback(
    async (body: string, author: { name: string; avatar?: string | null }, streamId?: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sign in to join the conversation.");

      const trimmed = body.trim();
      if (!trimmed) return;
      if (trimmed.length > 500) throw new Error("Keep comments under 500 characters.");

      const { error: insertError } = await supabase.from("stream_comments").insert({
        channel,
        stream_id: streamId ?? null,
        user_id: user.id,
        author_name: author.name,
        author_avatar: author.avatar ?? null,
        body: trimmed,
      });

      if (insertError) throw new Error(insertError.message);
    },
    [channel],
  );

  const hide = useCallback(async (id: string, reason = "Moderated by Command Center") => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error: updateError } = await supabase
      .from("stream_comments")
      .update({ is_hidden: true, hidden_reason: reason, hidden_by: user?.id ?? null })
      .eq("id", id);
    if (updateError) throw new Error(updateError.message);
  }, []);

  return { comments, loading, error, post, hide };
}
