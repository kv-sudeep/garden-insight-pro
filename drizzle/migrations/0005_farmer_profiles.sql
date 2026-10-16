CREATE TABLE public.farmer_profiles (
 user_id uuid PRIMARY KEY,
 farm_name text NOT NULL DEFAULT '',
 crops text[] NOT NULL DEFAULT '{}',
 fields text[] NOT NULL DEFAULT '{}',
 disease_history jsonb NOT NULL DEFAULT '[]'::jsonb,
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.farmer_profiles TO authenticated;
GRANT ALL ON public.farmer_profiles TO service_role;
ALTER TABLE public.farmer_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Farmers read own profile" ON public.farmer_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Farmers insert own profile" ON public.farmer_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Farmers update own profile" ON public.farmer_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Farmers delete own profile" ON public.farmer_profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);