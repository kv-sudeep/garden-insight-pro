-- Extra fields on garden plants: propagation parent, soil, map position, season, retirement
ALTER TABLE public.garden_plants
  ADD COLUMN IF NOT EXISTS parent_plant_id uuid REFERENCES public.garden_plants(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS soil_type text,
  ADD COLUMN IF NOT EXISTS bed text,
  ADD COLUMN IF NOT EXISTS map_x numeric,
  ADD COLUMN IF NOT EXISTS map_y numeric,
  ADD COLUMN IF NOT EXISTS season_start_month int,
  ADD COLUMN IF NOT EXISTS season_end_month int,
  ADD COLUMN IF NOT EXISTS retired_at timestamptz,
  ADD COLUMN IF NOT EXISTS retirement_note text,
  ADD COLUMN IF NOT EXISTS acquired_on date;

CREATE INDEX IF NOT EXISTS garden_plants_parent_idx ON public.garden_plants(parent_plant_id);

-- Growth timeline photos
CREATE TABLE IF NOT EXISTS public.plant_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id uuid NOT NULL REFERENCES public.garden_plants(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  image_url text NOT NULL,
  caption text,
  taken_at date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.plant_photos TO anon, authenticated;
GRANT ALL ON public.plant_photos TO service_role;
ALTER TABLE public.plant_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read plant_photos" ON public.plant_photos FOR SELECT USING (true);
CREATE POLICY "public insert plant_photos" ON public.plant_photos FOR INSERT WITH CHECK (true);
CREATE POLICY "public update plant_photos" ON public.plant_photos FOR UPDATE USING (true);
CREATE POLICY "public delete plant_photos" ON public.plant_photos FOR DELETE USING (true);
CREATE INDEX IF NOT EXISTS plant_photos_plant_idx ON public.plant_photos(plant_id, taken_at DESC);

-- Care / history / cost / yield log
CREATE TABLE IF NOT EXISTS public.plant_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id uuid NOT NULL REFERENCES public.garden_plants(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  kind text NOT NULL,
  occurred_on date NOT NULL DEFAULT CURRENT_DATE,
  note text,
  product text,
  cost numeric,
  currency text NOT NULL DEFAULT 'INR',
  yield_amount numeric,
  yield_unit text,
  effectiveness int,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.plant_events TO anon, authenticated;
GRANT ALL ON public.plant_events TO service_role;
ALTER TABLE public.plant_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read plant_events" ON public.plant_events FOR SELECT USING (true);
CREATE POLICY "public insert plant_events" ON public.plant_events FOR INSERT WITH CHECK (true);
CREATE POLICY "public update plant_events" ON public.plant_events FOR UPDATE USING (true);
CREATE POLICY "public delete plant_events" ON public.plant_events FOR DELETE USING (true);
CREATE INDEX IF NOT EXISTS plant_events_plant_idx ON public.plant_events(plant_id, occurred_on DESC);
CREATE INDEX IF NOT EXISTS plant_events_device_idx ON public.plant_events(device_id, kind);