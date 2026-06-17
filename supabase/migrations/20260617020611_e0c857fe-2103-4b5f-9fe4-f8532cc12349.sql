CREATE TABLE public.favorite_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  base_id text NOT NULL,
  tier integer NOT NULL,
  enchant integer NOT NULL DEFAULT 0,
  quality integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, base_id, tier, enchant, quality)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorite_items TO authenticated;
GRANT ALL ON public.favorite_items TO service_role;

ALTER TABLE public.favorite_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites"
  ON public.favorite_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites"
  ON public.favorite_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON public.favorite_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_favorite_items_user ON public.favorite_items(user_id, created_at DESC);