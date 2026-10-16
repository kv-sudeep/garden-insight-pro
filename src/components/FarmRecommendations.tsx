import { Link } from '@tanstack/react-router';
import { Sprout, ChevronRight } from 'lucide-react';
import { useFarm } from '@/components/FarmProvider';
import { recommendationReason } from '@/lib/farm';
export function FarmRecommendations() {
  const { farm, user, loading, error, diseases } = useFarm();
  const rows = diseases.map(disease => ({ disease, reason: recommendationReason(disease, farm) })).filter(row => row.reason).sort((a, b) => Number(farm.disease_history.some(r => r.slug === b.disease.slug)) - Number(farm.disease_history.some(r => r.slug === a.disease.slug))).slice(0, 3);
  return <section className="my-6" aria-label="Farm recommendations">
    <div className="mb-3 flex items-center justify-between gap-2"><h2 className="text-sm font-semibold">For Your Farm</h2><Link to="/farm" className="flex items-center gap-1 text-xs text-accent"><Sprout className="h-3.5 w-3.5"/>My Farm<ChevronRight className="h-3 w-3"/></Link></div>
    {loading ? <p className="text-xs text-muted-foreground">Loading your farm…</p> : error ? <p className="text-xs text-warning">{error}</p> : rows.length ? <div className="space-y-2">{rows.map(({ disease, reason }) => <Link key={disease.slug} to="/guides/disease/$slug" params={{ slug: disease.slug }} className="glass-panel flex items-center gap-3 overflow-hidden rounded-lg">
      {disease.image_url && <img src={disease.image_url} alt={disease.name} className="h-20 w-20 shrink-0 object-cover"/>}<div className="min-w-0 flex-1 py-3 pl-3 pr-2"><p className="text-sm font-semibold">{disease.name}</p><p className="mt-1 text-xs text-accent">{reason}</p></div><ChevronRight className="mr-3 h-4 w-4 shrink-0 text-accent"/>
    </Link>)}</div> : <Link to={user ? '/farm' : '/auth'} className="flex items-center gap-3 border-y border-border py-4 text-xs text-muted-foreground"><Sprout className="neon-icon h-6 w-6"/>{user ? 'Add your crops and disease history' : 'Sign in to save your farm'}<ChevronRight className="ml-auto h-4 w-4"/></Link>}
  </section>;
}