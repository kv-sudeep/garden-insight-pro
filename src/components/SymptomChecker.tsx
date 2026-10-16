import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Stethoscope, RotateCcw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFarm } from '@/components/FarmProvider';
import { SYMPTOMS, matchSymptoms, type SymptomId } from '@/lib/farm';
export function SymptomChecker() {
  const { diseases, farm, catalogError, retry } = useFarm();
  const [selected, setSelected] = useState<SymptomId[]>([]);
  const [crop, setCrop] = useState('');
  const [checked, setChecked] = useState(false);
  const matches = matchSymptoms(diseases, selected, crop);
  return <section className="mt-6 border-y border-border py-5" aria-label="Symptom checker">
    <div className="mb-4 flex items-center gap-2"><Stethoscope className="neon-icon h-5 w-5"/><h2 className="text-sm font-semibold">Symptom Checker</h2><Button variant="ghost" size="icon" className="ml-auto" aria-label="Reset symptoms" title="Reset symptoms" onClick={() => { setSelected([]); setCrop(''); setChecked(false); }}><RotateCcw/></Button></div>
    <label htmlFor="symptom-crop" className="text-xs text-muted-foreground">Crop (optional)</label><Input id="symptom-crop" list="farm-crop-options" placeholder="e.g. Tomato" value={crop} onChange={e => { setCrop(e.target.value); setChecked(false); }} className="mb-4 mt-2"/><datalist id="farm-crop-options">{farm.crops.map(name => <option key={name} value={name}/>)}</datalist>
    <fieldset><legend className="mb-2 text-xs text-muted-foreground">Symptoms</legend><div className="flex flex-wrap gap-2">{SYMPTOMS.map(sign => <Button key={sign.id} variant={selected.includes(sign.id) ? 'default' : 'outline'} aria-pressed={selected.includes(sign.id)} size="sm" className="text-xs" onClick={() => { setSelected(prev => prev.includes(sign.id) ? prev.filter(id => id !== sign.id) : [...prev, sign.id]); setChecked(false); }}>{sign.label}</Button>)}</div></fieldset>
    <Button className="blue-button mt-4 w-full" disabled={!selected.length || !diseases.length} onClick={() => setChecked(true)}><Search/>Find Possible Diseases</Button>
    {catalogError && <div className="mt-3 text-xs text-warning">Disease guides could not be loaded.<Button variant="link" size="sm" onClick={retry}>Try again</Button></div>}
    {checked && <div className="mt-4" aria-live="polite"><h3 className="mb-2 text-sm font-semibold">Possible Matches</h3><p className="mb-3 text-xs leading-5 text-muted-foreground">Symptom matches, not a confirmed diagnosis. Similar signs may have other causes. Confirm with a plant expert before treatment.</p>
      {!matches.length && <p className="text-sm text-muted-foreground">No matching guide for this crop and symptoms. Try another crop name or scan your plant.</p>}
      <div className="space-y-2">{matches.map(({ disease, matched }) => <Link key={disease.slug} to="/guides/disease/$slug" params={{ slug: disease.slug }} className="glass-panel block rounded-lg p-3"><div className="flex items-start justify-between gap-2"><h4 className="text-sm font-semibold">{disease.name}</h4><span className="shrink-0 text-xs text-accent">{matched.length}/{selected.length} signs</span></div><p className="mt-1 text-xs text-accent">{SYMPTOMS.filter(sign => matched.includes(sign.id)).map(sign => sign.label).join(' · ')}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{disease.symptoms}</p></Link>)}</div>
      <Button asChild variant="outline" className="mt-3 w-full"><Link to="/scan">Scan My Plant</Link></Button>
    </div>}
  </section>;
}