
-- Scans (anonymous, scoped by client device_id)
CREATE TABLE public.scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  plant_name TEXT,
  disease_name TEXT,
  is_healthy BOOLEAN DEFAULT false,
  severity TEXT,
  confidence NUMERIC,
  symptoms TEXT,
  treatment TEXT,
  organic_treatment TEXT,
  prevention TEXT,
  shop_query TEXT,
  raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX scans_device_idx ON public.scans(device_id, created_at DESC);

CREATE TABLE public.garden_plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  name TEXT NOT NULL,
  species TEXT,
  image_url TEXT,
  notes TEXT,
  last_scan_id UUID REFERENCES public.scans(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX garden_device_idx ON public.garden_plants(device_id, created_at DESC);

CREATE TABLE public.plant_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  scientific_name TEXT,
  category TEXT,
  description TEXT,
  water TEXT,
  sunlight TEXT,
  soil TEXT,
  common_diseases TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garden_plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plant_library ENABLE ROW LEVEL SECURITY;

-- Anonymous public access (app does not have user accounts; data scoped client-side by device_id)
CREATE POLICY "public read scans" ON public.scans FOR SELECT USING (true);
CREATE POLICY "public insert scans" ON public.scans FOR INSERT WITH CHECK (true);
CREATE POLICY "public delete scans" ON public.scans FOR DELETE USING (true);

CREATE POLICY "public read garden" ON public.garden_plants FOR SELECT USING (true);
CREATE POLICY "public insert garden" ON public.garden_plants FOR INSERT WITH CHECK (true);
CREATE POLICY "public update garden" ON public.garden_plants FOR UPDATE USING (true);
CREATE POLICY "public delete garden" ON public.garden_plants FOR DELETE USING (true);

CREATE POLICY "public read library" ON public.plant_library FOR SELECT USING (true);

-- Storage bucket for scan photos
INSERT INTO storage.buckets (id, name, public) VALUES ('scans', 'scans', true);

CREATE POLICY "public read scans bucket" ON storage.objects FOR SELECT USING (bucket_id = 'scans');
CREATE POLICY "public upload scans bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'scans');

-- Seed plant library
INSERT INTO public.plant_library (name, scientific_name, category, description, water, sunlight, soil, common_diseases) VALUES
('Tomato', 'Solanum lycopersicum', 'Vegetable', 'Warm-season crop prized for juicy fruits.', 'Deep watering 2-3x/week; keep soil evenly moist', 'Full sun (6-8h)', 'Well-drained, rich loam, pH 6.2-6.8', 'Early blight, Late blight, Septoria leaf spot, Fusarium wilt'),
('Rose', 'Rosa spp.', 'Flower', 'Classic ornamental with fragrant blooms.', 'Deep weekly soak; avoid wetting foliage', 'Full sun (6h+)', 'Loamy, well-drained, pH 6.0-6.5', 'Black spot, Powdery mildew, Rust, Aphids'),
('Basil', 'Ocimum basilicum', 'Herb', 'Aromatic culinary herb.', 'Keep soil moist, water when top inch dry', 'Full sun to part shade', 'Rich, well-drained', 'Fusarium wilt, Downy mildew'),
('Apple', 'Malus domestica', 'Fruit Tree', 'Deciduous fruit tree.', 'Deep weekly watering during dry spells', 'Full sun', 'Well-drained loam, pH 6.0-7.0', 'Apple scab, Fire blight, Cedar-apple rust'),
('Pepper', 'Capsicum annuum', 'Vegetable', 'Warm-season fruiting vegetable.', 'Consistent moisture, avoid waterlogging', 'Full sun', 'Well-drained, rich', 'Bacterial spot, Anthracnose, Mosaic virus'),
('Cucumber', 'Cucumis sativus', 'Vegetable', 'Climbing vine producing crisp fruits.', 'Frequent deep watering', 'Full sun', 'Loose, fertile, well-drained', 'Powdery mildew, Downy mildew, Bacterial wilt'),
('Mint', 'Mentha spp.', 'Herb', 'Vigorous aromatic herb.', 'Keep moist consistently', 'Part shade to full sun', 'Moist, rich', 'Rust, Verticillium wilt'),
('Strawberry', 'Fragaria × ananassa', 'Fruit', 'Low-growing perennial fruit.', '1-2 inches/week', 'Full sun', 'Sandy loam, pH 5.5-6.8', 'Gray mold, Leaf spot, Powdery mildew'),
('Lemon Tree', 'Citrus limon', 'Fruit Tree', 'Evergreen citrus tree.', 'Deep water when top 2 inches dry', 'Full sun', 'Well-drained, slightly acidic', 'Citrus canker, Greasy spot, Root rot'),
('Snake Plant', 'Dracaena trifasciata', 'Houseplant', 'Hardy upright succulent.', 'Sparingly; let dry between waterings', 'Low to bright indirect', 'Well-drained cactus mix', 'Root rot from overwatering'),
('Monstera', 'Monstera deliciosa', 'Houseplant', 'Tropical climber with split leaves.', 'Water when top inch dry', 'Bright indirect', 'Peat-based, well-drained', 'Root rot, Leaf spot'),
('Lavender', 'Lavandula angustifolia', 'Herb/Flower', 'Drought-tolerant fragrant shrub.', 'Sparing; drought tolerant once established', 'Full sun', 'Well-drained, alkaline', 'Root rot, Phytophthora');
