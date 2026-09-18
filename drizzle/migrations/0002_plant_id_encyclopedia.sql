-- Plant identification results (anonymous, keyed by device_id)
CREATE TABLE public.identifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  image_url text NOT NULL,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  common_name text,
  scientific_name text,
  family text,
  also_known_as text,
  confidence numeric,
  summary text,
  water text,
  sunlight text,
  soil text,
  soil_ph text,
  toxicity text,
  edible_parts text,
  native_range text,
  invasive_notes text,
  common_mistakes text,
  companion_plants text,
  similar_plants text,
  care_calendar text,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.identifications TO anon, authenticated;
GRANT ALL ON public.identifications TO service_role;
ALTER TABLE public.identifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read identifications" ON public.identifications FOR SELECT USING (true);
CREATE POLICY "public insert identifications" ON public.identifications FOR INSERT WITH CHECK (true);
CREATE POLICY "public delete identifications" ON public.identifications FOR DELETE USING (true);
CREATE INDEX identifications_device_idx ON public.identifications (device_id, created_at DESC);

-- Browsable disease encyclopedia
CREATE TABLE public.diseases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'disease',
  pathogen text,
  affects text,
  summary text,
  symptoms text,
  causes text,
  treatment text,
  organic_treatment text,
  prevention text,
  severity text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.diseases TO anon, authenticated;
GRANT ALL ON public.diseases TO service_role;
ALTER TABLE public.diseases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read diseases" ON public.diseases FOR SELECT USING (true);

-- Browsable pest encyclopedia
CREATE TABLE public.pests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  scientific_name text,
  affects text,
  summary text,
  identify text,
  damage text,
  lifecycle text,
  treatment text,
  organic_treatment text,
  prevention text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pests TO anon, authenticated;
GRANT ALL ON public.pests TO service_role;
ALTER TABLE public.pests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read pests" ON public.pests FOR SELECT USING (true);

-- Richer per-plant guide data
ALTER TABLE public.plant_library
  ADD COLUMN soil_ph text,
  ADD COLUMN toxicity text,
  ADD COLUMN edible_parts text,
  ADD COLUMN common_mistakes text,
  ADD COLUMN companion_plants text,
  ADD COLUMN avoid_near text,
  ADD COLUMN native_range text,
  ADD COLUMN invasive_notes text,
  ADD COLUMN similar_plants text,
  ADD COLUMN pronunciation text;