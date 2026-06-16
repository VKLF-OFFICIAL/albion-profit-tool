import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ProfileInfo {
  userId: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  loading: boolean;
}

export function useProfile(): ProfileInfo {
  const [info, setInfo] = useState<ProfileInfo>({
    userId: "",
    email: "",
    username: "",
    avatarUrl: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: u } = await supabase.auth.getUser();
      const user = u.user;
      if (!user) {
        if (!cancelled) setInfo((p) => ({ ...p, loading: false }));
        return;
      }
      const { data: prof } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      let signed: string | null = null;
      if (prof?.avatar_url) {
        if (prof.avatar_url.startsWith("http")) {
          signed = prof.avatar_url;
        } else {
          const { data: s } = await supabase.storage
            .from("avatars")
            .createSignedUrl(prof.avatar_url, 3600);
          signed = s?.signedUrl ?? null;
        }
      }

      if (cancelled) return;
      setInfo({
        userId: user.id,
        email: user.email ?? "",
        username: prof?.username ?? (user.email?.split("@")[0] ?? "Aventurero"),
        avatarUrl: signed,
        loading: false,
      });
    }

    load();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") load();
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return info;
}
