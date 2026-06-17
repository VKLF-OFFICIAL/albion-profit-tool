import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Tool = "prices" | "transport" | "refining" | "crafting";

export interface RecentSearch {
  id: string;
  tool: Tool;
  base_id: string;
  tier: number;
  enchant: number;
  quality: number;
  last_used_at: string;
}

type RecordInput = {
  tool: Tool;
  base_id: string;
  tier: number;
  enchant?: number;
  quality?: number;
};

const EVENT = "recent-searches:updated";

/** Records (upserts) a recent search. Fire-and-forget; safe to await. */
export async function recordRecentSearch(input: RecordInput) {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return;
  const payload = {
    user_id: uid,
    tool: input.tool,
    base_id: input.base_id,
    tier: input.tier,
    enchant: input.enchant ?? 0,
    quality: input.quality ?? 1,
    last_used_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("recent_searches")
    .upsert(payload, { onConflict: "user_id,tool,base_id,tier,enchant,quality" });
  if (!error && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT));
  }
}

export function useRecentSearches(limit = 12) {
  const [items, setItems] = useState<RecentSearch[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) {
      setItems([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("recent_searches")
      .select("id, tool, base_id, tier, enchant, quality, last_used_at")
      .order("last_used_at", { ascending: false })
      .limit(limit);
    setItems((data ?? []) as RecentSearch[]);
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    void load();
    if (typeof window === "undefined") return;
    const handler = () => void load();
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, [load]);

  const remove = useCallback(async (id: string) => {
    await supabase.from("recent_searches").delete().eq("id", id);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(EVENT));
    }
  }, []);

  return { items, loading, remove, refresh: load };
}
