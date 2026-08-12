-- Supabase initial schema for food management app

-- Table: public.items
CREATE TABLE public.items (
  id uuid primary key default gen_random_uuid(),
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
