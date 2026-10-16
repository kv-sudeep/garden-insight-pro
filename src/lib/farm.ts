export type DiseaseRecord = { id: string; slug: string; crop: string; field: string; date: string };
export type FarmProfile = { farm_name: string; crops: string[]; fields: string[]; disease_history: DiseaseRecord[] };
export type FarmDisease = { slug: string; name: string; affects: string | null; symptoms: string | null; summary: string | null; image_url: string | null };
export const emptyFarm: FarmProfile = { farm_name: '', crops: [], fields: [], disease_history: [] };
export const SYMPTOMS = [
  { id: 'yellow', label: 'Yellow leaves' }, { id: 'spots', label: 'Dark leaf spots' },
  { id: 'powder', label: 'White powder' }, { id: 'wilt', label: 'Wilting' },
  { id: 'curl', label: 'Curled / distorted leaves' }, { id: 'mould', label: 'Fuzzy mould' },
  { id: 'fruit', label: 'Rotting fruit' }, { id: 'roots', label: 'Soft / rotten roots' },
  { id: 'stunted', label: 'Slow growth' }, { id: 'rings', label: 'Bullseye rings' },
  { id: 'mosaic', label: 'Mottled leaves' }, { id: 'seedling', label: 'Seedlings collapsing' },
  { id: 'rust', label: 'Orange / rust pustules' }, { id: 'veins', label: 'Yellow leaves, green veins' },
] as const;
export type SymptomId = typeof SYMPTOMS[number]['id'];
const SIGNS: Record<string, SymptomId[]> = {
  'anthracnose': ['spots', 'fruit'], 'bacterial-leaf-spot': ['spots', 'fruit'],
  'black-spot-rose': ['spots', 'yellow'], 'blossom-end-rot': ['fruit'],
  'botrytis-grey-mould': ['mould', 'fruit', 'spots'], 'damping-off': ['seedling', 'mould'],
  'downy-mildew': ['yellow', 'mould', 'wilt'], 'early-blight': ['spots', 'rings', 'yellow', 'fruit'],
  'fusarium-wilt': ['wilt', 'yellow', 'stunted'], 'iron-chlorosis': ['yellow', 'veins', 'stunted'],
  'late-blight': ['spots', 'mould', 'fruit'], 'mosaic-virus': ['mosaic', 'curl', 'stunted'],
  'nitrogen-deficiency': ['yellow', 'stunted'], 'powdery-mildew': ['powder', 'yellow', 'curl'],
  'root-rot': ['roots', 'wilt', 'yellow', 'stunted'], 'rust': ['rust', 'yellow'],
  'septoria-leaf-spot': ['spots', 'yellow'], 'verticillium-wilt': ['wilt', 'yellow', 'stunted'],
};
const normalize = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '');
const aliases: Record<string, string> = { tomatoes: 'tomato', potatoes: 'potato', roses: 'rose', grapes: 'grape', beans: 'bean', chillies: 'chilli', chili: 'chilli', brinjal: 'eggplant', aubergine: 'eggplant', courgette: 'zucchini' };
const canonical = (value: string) => aliases[normalize(value)] ?? normalize(value);
export function affectsCrop(disease: Pick<FarmDisease, 'affects'>, crop: string): boolean {
  if (!crop.trim()) return false;
  const text = normalize(disease.affects ?? '');
  if (/all plants|almost all|all kinds/.test(text)) return true;
  const name = canonical(crop);
  if (text.includes('cucurbit') && ['cucumber', 'pumpkin', 'squash', 'melon', 'zucchini'].includes(name)) return true;
  return (disease.affects ?? '').split(',').some(part => canonical(part) === name || normalize(part).split(' ').some(word => canonical(word) === name));
}
export function recommendationReason(disease: FarmDisease, farm: FarmProfile): string | null {
  if (farm.disease_history.some(record => record.slug === disease.slug)) return 'Previously recorded on your farm';
  const crops = farm.crops.filter(crop => affectsCrop(disease, crop));
  return crops.length ? `Affects ${crops.join(', ')}` : null;
}
export function matchSymptoms(diseases: FarmDisease[], selected: SymptomId[], crop: string) {
  if (!selected.length) return [];
  return diseases.filter(d => !crop || affectsCrop(d, crop)).map(disease => {
    const matched = selected.filter(sign => (SIGNS[disease.slug] ?? []).includes(sign));
    return { disease, matched, score: matched.length / selected.length };
  }).filter(result => result.matched.length > 0).sort((a, b) => b.score - a.score || a.disease.name.localeCompare(b.disease.name)).slice(0, 4);
}