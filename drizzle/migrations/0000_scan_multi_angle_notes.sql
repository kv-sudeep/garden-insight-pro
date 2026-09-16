ALTER TABLE public.scans
  ADD COLUMN IF NOT EXISTS images jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS user_notes text,
  ADD COLUMN IF NOT EXISTS image_hash text;

CREATE INDEX IF NOT EXISTS scans_device_hash_idx ON public.scans (device_id, image_hash);