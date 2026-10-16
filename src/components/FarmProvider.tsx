import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { emptyFarm, type FarmProfile, type FarmDisease, type DiseaseRecord } from '@/lib/farm';
import type { Json } from '@/integrations/supabase/types';

type FarmState = { user: User | null; farm: FarmProfile; loading: boolean; error: string | null; diseases: FarmDisease[]; catalogError: boolean; save: (farm: FarmProfile) => Promise<void>; retry: () => void };
const FarmContext = createContext<FarmState | null>(null);
function parseHistory(raw: Json): DiseaseRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is { id: string; slug: string; crop: string; field: string; date: string } => !!item && typeof item === 'object' && !Array.isArray(item) && ['id', 'slug', 'crop', 'field', 'date'].every(key => typeof item[key] === 'string'));
}
export function FarmProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [farm, setFarm] = useState<FarmProfile>(emptyFarm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diseases, setDiseases] = useState<FarmDisease[]>([]);
  const [catalogError, setCatalogError] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    const update = (next: User | null) => { if (active) setUser(next); };
    supabase.auth.getUser().then(({ data }) => update(data.user)).finally(() => { if (active) setLoading(false); });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') update(session?.user ?? null);
    });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);
  useEffect(() => {
    let active = true;
    setFarm(emptyFarm); setError(null);
    if (!user) return;
    setLoading(true);
    supabase.from('farmer_profiles').select('*').eq('user_id', user.id).maybeSingle().then(({ data, error: failure }) => {
      if (!active) return;
      if (failure) setError('Your farm could not be loaded. Please try again.');
      else if (data) setFarm({ farm_name: data.farm_name, crops: data.crops, fields: data.fields, disease_history: parseHistory(data.disease_history) });
      setLoading(false);
    });
    return () => { active = false; };
  }, [user?.id, revision]);
  useEffect(() => {
    let active = true;
    supabase.from('diseases').select('slug, name, affects, symptoms, summary, image_url').order('name').then(({ data, error }) => {
      if (active) { setDiseases(data ?? []); setCatalogError(!!error); }
    });
    return () => { active = false; };
  }, [revision]);
  async function save(next: FarmProfile) {
    if (!user) throw new Error('Sign in to save your farm.');
    const { error } = await supabase.from('farmer_profiles').upsert({ user_id: user.id, ...next, disease_history: next.disease_history as unknown as Json, updated_at: new Date().toISOString() });
    if (error) throw new Error('Your farm could not be saved. Please try again.');
    setFarm(next);
  }
  return <FarmContext.Provider value={{ user, farm, loading, error, diseases, catalogError, save, retry: () => setRevision(value => value + 1) }}>{children}</FarmContext.Provider>;
}
export function useFarm() {
  const context = useContext(FarmContext);
  if (!context) throw new Error('FarmProvider is required');
  return context;
}