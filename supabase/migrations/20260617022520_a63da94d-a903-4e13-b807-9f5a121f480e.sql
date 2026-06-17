-- Drop legacy favorites
DROP TABLE IF EXISTS public.favorite_items CASCADE;

-- Recent searches per user per tool
CREATE TABLE public.recent_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool text NOT NULL CHECK (tool IN ('prices','transport','refining','crafting')),
  base_id text NOT NULL,
  tier integer NOT NULL DEFAULT 4,
  enchant integer NOT NULL DEFAULT 0,
  quality integer NOT NULL DEFAULT 1,
  last_used_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tool, base_id, tier, enchant, quality)
);
CREATE INDEX recent_searches_user_recent_idx
  ON public.recent_searches (user_id, last_used_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.recent_searches TO authenticated;
GRANT ALL ON public.recent_searches TO service_role;

ALTER TABLE public.recent_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own recent searches" ON public.recent_searches
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own recent searches" ON public.recent_searches
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own recent searches" ON public.recent_searches
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own recent searches" ON public.recent_searches
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Gold transactions (buy/sell) per user
CREATE TABLE public.gold_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tx_type text NOT NULL CHECK (tx_type IN ('buy','sell')),
  amount_gold integer NOT NULL CHECK (amount_gold > 0),
  price_silver bigint NOT NULL CHECK (price_silver > 0),
  note text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX gold_transactions_user_time_idx
  ON public.gold_transactions (user_id, occurred_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gold_transactions TO authenticated;
GRANT ALL ON public.gold_transactions TO service_role;

ALTER TABLE public.gold_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own gold tx" ON public.gold_transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own gold tx" ON public.gold_transactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own gold tx" ON public.gold_transactions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own gold tx" ON public.gold_transactions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Trim helper: keep only 20 most recent searches per user
CREATE OR REPLACE FUNCTION public.trim_recent_searches()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.recent_searches
  WHERE user_id = NEW.user_id
    AND id NOT IN (
      SELECT id FROM public.recent_searches
      WHERE user_id = NEW.user_id
      ORDER BY last_used_at DESC
      LIMIT 20
    );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trim_recent_searches_trg
AFTER INSERT OR UPDATE ON public.recent_searches
FOR EACH ROW EXECUTE FUNCTION public.trim_recent_searches();