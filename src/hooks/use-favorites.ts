import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FavoriteItem {
  id: string;
  base_id: string;
  tier: number;
  enchant: number;
  quality: number;
  created_at: string;
}

export interface FavoriteKey {
  base_id: string;
  tier: number;
  enchant: number;
  quality: number;
}

export function favKey(f: FavoriteKey): string {
  return `${f.base_id}|${f.tier}|${f.enchant}|${f.quality}`;
}

export function useFavorites() {
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id ?? null;
    setUserId(uid);
    if (!uid) {
      setItems([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("favorite_items")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    setItems((data as FavoriteItem[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const onUpdated = () => load();
    window.addEventListener("favorites:updated", onUpdated);
    const { data: sub } = supabase.auth.onAuthStateChange((e) => {
      if (e === "SIGNED_IN" || e === "SIGNED_OUT") load();
    });
    return () => {
      window.removeEventListener("favorites:updated", onUpdated);
      sub.subscription.unsubscribe();
    };
  }, [load]);

  const isFavorite = useCallback(
    (k: FavoriteKey) => items.some((i) => favKey(i) === favKey(k)),
    [items],
  );

  const toggle = useCallback(
    async (k: FavoriteKey) => {
      if (!userId) return;
      const existing = items.find((i) => favKey(i) === favKey(k));
      if (existing) {
        setItems((prev) => prev.filter((i) => i.id !== existing.id));
        const { error } = await supabase
          .from("favorite_items")
          .delete()
          .eq("id", existing.id);
        if (error) {
          await load();
          throw error;
        }
      } else {
        const { data, error } = await supabase
          .from("favorite_items")
          .insert({ user_id: userId, ...k })
          .select()
          .single();
        if (error) {
          await load();
          throw error;
        }
        setItems((prev) => [data as FavoriteItem, ...prev]);
      }
      window.dispatchEvent(new CustomEvent("favorites:updated"));
    },
    [items, userId, load],
  );

  return { items, loading, isFavorite, toggle, reload: load };
}
