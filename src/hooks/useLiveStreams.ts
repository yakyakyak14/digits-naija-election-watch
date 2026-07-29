import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type LiveStream = Database["public"]["Tables"]["live_streams"]["Row"];
export type BroadcastState = Database["public"]["Tables"]["broadcast_state"]["Row"];

export const LIVE_STREAM_KEY = ["live-streams"] as const;
export const BROADCAST_STATE_KEY = ["broadcast-state"] as const;

async function fetchStreams(scope: "public" | "all"): Promise<LiveStream[]> {
  let query = supabase
    .from("live_streams")
    .select("*")
    .order("priority", { ascending: false })
    .order("tile_slot", { ascending: true, nullsFirst: false })
    .order("started_at", { ascending: false });

  if (scope === "public") {
    query = query.eq("is_approved", true).in("status", ["live", "paused"]);
  } else {
    query = query.neq("status", "ended");
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Live feed list kept warm by a single Supabase Realtime subscription. An
 * operator approving a feed, retitling it, or ending it lands on every open
 * viewer within a round trip — no polling.
 */
export function useLiveStreams(scope: "public" | "all" = "public") {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: [...LIVE_STREAM_KEY, scope],
    queryFn: () => fetchStreams(scope),
    staleTime: 15_000,
  });

  useEffect(() => {
    const channel = supabase
      .channel(`live-streams-${scope}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "live_streams" }, () => {
        qc.invalidateQueries({ queryKey: [...LIVE_STREAM_KEY, scope] });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc, scope]);

  return query;
}

/** The operator-controlled public grid layout (tile count, slot assignment, ticker). */
export function useBroadcastState() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: BROADCAST_STATE_KEY,
    queryFn: async (): Promise<BroadcastState | null> => {
      const { data, error } = await supabase.from("broadcast_state").select("*").maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
    staleTime: 15_000,
  });

  useEffect(() => {
    const channel = supabase
      .channel("broadcast-state")
      .on("postgres_changes", { event: "*", schema: "public", table: "broadcast_state" }, () => {
        qc.invalidateQueries({ queryKey: BROADCAST_STATE_KEY });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);

  return query;
}

/**
 * Resolves the ordered tiles the public grid should render: explicit operator
 * slot assignments first, then the highest-priority approved feeds to fill any
 * remaining tiles.
 */
export function resolveGridTiles(
  streams: LiveStream[],
  state: BroadcastState | null,
  tileCountOverride?: number,
): LiveStream[] {
  const tileCount = Math.min(6, Math.max(1, tileCountOverride ?? state?.tile_count ?? 4));
  const byId = new Map(streams.map((s) => [s.id, s]));

  const slots = [
    state?.slot_1,
    state?.slot_2,
    state?.slot_3,
    state?.slot_4,
    state?.slot_5,
    state?.slot_6,
  ];
  const picked: LiveStream[] = [];
  const used = new Set<string>();

  for (const id of slots.slice(0, tileCount)) {
    if (!id) continue;
    const stream = byId.get(id);
    if (stream && !used.has(stream.id)) {
      picked.push(stream);
      used.add(stream.id);
    }
  }

  for (const stream of streams) {
    if (picked.length >= tileCount) break;
    if (!used.has(stream.id)) {
      picked.push(stream);
      used.add(stream.id);
    }
  }

  return picked.slice(0, tileCount);
}
