import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { MobileLayout } from '@/components/MobileLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFarm } from '@/components/FarmProvider';
import { parseTags } from '@/lib/garden';
import type { FarmProfile } from '@/lib/farm';

export const Route = createFileRoute('/farm')({
  head: () => ({ meta: [
    { title: 'My Farm Profile — KrushiMitra AI' },
    { name: 'description', content: 'Save your crops, fields and past plant diseases for personalized guide recommendations.' },
    { property: 'og:title', content: 'My Farm Profile — KrushiMitra AI' },
    { property: 'og:description', content: 'Personalized plant disease guides for your farm.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] }),
  component: FarmPage,
});

function FarmPage() {
  const { user, farm, loading, error, diseases, save, retry } = useFarm();
  const [draft, setDraft] = useState<FarmProfile>(farm);
  const [crops, setCrops] = useState('');
  const [fields, setFields] = useState('');
  const [record, setRecord] = useState({ slug: '', crop: '', field: '', date: new Date().toISOString().slice(0, 10) });
  const [busy, setBusy] = useState(false);
  useEffect(() => { setDraft(farm); setCrops(farm.crops.join(', ')); setFields(farm.fields.join(', ')); }, [farm]);
  if (!loading && !user) return <MobileLayout><div className="px-5 pt-16 text-center"><h1 className="text-xl font-bold">My Farm</h1><p className="mt-2 text-sm text-muted-foreground">Sign in to save crops, fields and disease history.</p><Button asChild className="blue-button mt-6 w-full"><Link to="/auth">Sign in</Link></Button></div></MobileLayout>;
  const name = (slug: string) => diseases.find(d => d.slug === slug)?.name ?? slug;
  async function submit() {
    setBusy(true);
    try { await save({ ...draft, crops: parseTags(crops).map(c => c.replace(/\b\w/g, l => l.toUpperCase())), fields: fields.split(',').map(f => f.trim()).filter(Boolean) }); toast.success('Farm saved'); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Could not save'); }
    finally { setBusy(false); }
  }
  return <MobileLayout><div className="px-5 pb-8 pt-7">
    <div className="flex items-center gap-3"><Link to="/" aria-label="Back to home" className="glass-panel flex h-9 w-9 items-center justify-center rounded-full"><ArrowLeft className="h-4 w-4"/></Link><h1 className="text-lg font-semibold">My Farm</h1></div>
    {error && <p className="mt-4 text-sm text-warning">{error} <button className="text-accent" onClick={retry}>Try again</button></p>}
    {loading ? <p className="mt-6 text-sm text-muted-foreground">Loading…</p> : <div className="mt-6 space-y-4">
      <label className="block text-xs text-muted-foreground">Farm name<Input className="mt-2" value={draft.farm_name} onChange={e => setDraft({ ...draft, farm_name: e.target.value })} placeholder="e.g. Green Acres"/></label>
      <label className="block text-xs text-muted-foreground">Crops (comma separated)<Input className="mt-2" value={crops} onChange={e => setCrops(e.target.value)} placeholder="Tomato, Potato, Chilli"/></label>
      <label className="block text-xs text-muted-foreground">Fields (comma separated)<Input className="mt-2" value={fields} onChange={e => setFields(e.target.value)} placeholder="North field, Greenhouse"/></label>
      <section className="border-t border-border pt-4"><h2 className="text-sm font-semibold">Past Diseases</h2>
        <div className="mt-3 space-y-2">{draft.disease_history.length === 0 && <p className="text-xs text-muted-foreground">No diseases recorded yet.</p>}
          {draft.disease_history.map(r => <div key={r.id} className="glass-panel flex items-center gap-2 rounded-lg p-3"><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{name(r.slug)}</p><p className="text-xs text-muted-foreground">{[r.crop, r.field, r.date].filter(Boolean).join(' · ')}</p></div><Button variant="ghost" size="icon" aria-label={`Remove ${name(r.slug)}`} onClick={() => setDraft({ ...draft, disease_history: draft.disease_history.filter(x => x.id !== r.id) })}><Trash2/></Button></div>)}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <select aria-label="Disease" value={record.slug} onChange={e => setRecord({ ...record, slug: e.target.value })} className="col-span-2 h-9 rounded-md border border-input bg-background px-2 text-sm"><option value="">Choose disease…</option>{diseases.map(d => <option key={d.slug} value={d.slug}>{d.name}</option>)}</select>
          <Input aria-label="Crop" placeholder="Crop" value={record.crop} onChange={e => setRecord({ ...record, crop: e.target.value })}/>
          <Input aria-label="Field" placeholder="Field" value={record.field} onChange={e => setRecord({ ...record, field: e.target.value })}/>
          <Input aria-label="Date" type="date" value={record.date} onChange={e => setRecord({ ...record, date: e.target.value })}/>
          <Button variant="outline" disabled={!record.slug} onClick={() => { setDraft({ ...draft, disease_history: [{ ...record, id: crypto.randomUUID() }, ...draft.disease_history] }); setRecord({ ...record, slug: '' }); }}><Plus/>Add</Button>
        </div>
      </section>
      <Button className="blue-button w-full" disabled={busy} onClick={submit}><Save/>{busy ? 'Saving…' : 'Save Farm'}</Button>
    </div>}
  </div></MobileLayout>;
}