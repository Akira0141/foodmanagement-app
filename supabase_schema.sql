-- Supabase initial schema for food management app

-- Table: public.items
CREATE TABLE public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  quantity numeric,
  unit text,
  location text,
  purchased_at date,
  expires_at date,
  emoji text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
CREATE INDEX idx_items_expires_at ON public.items(expires_at);
CREATE INDEX idx_items_location ON public.items(location);
CREATE INDEX idx_items_user_id ON public.items(user_id);

-- RLS
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own items"
  ON public.items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own items"
  ON public.items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own items"
  ON public.items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own items"
  ON public.items FOR DELETE
  USING (auth.uid() = user_id);
