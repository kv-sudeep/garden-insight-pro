// Shared garden types, helpers and small knowledge tables.

export type GardenPlant = {
  id: string;
  name: string;
  nickname: string | null;
  species: string | null;
  image_url: string | null;
  notes: string | null;
  category: string | null;
  location: string | null;
  tags: string[] | null;
  archived_at: string | null;
  created_at: string;
  parent_plant_id: string | null;
  soil_type: string | null;
  bed: string | null;
  map_x: number | null;
  map_y: number | null;
  season_start_month: number | null;
  season_end_month: number | null;
  retired_at: string | null;
  retirement_note: string | null;
  acquired_on: string | null;
};

export const PLANT_COLS =
  "id, name, nickname, species, image_url, notes, category, location, tags, archived_at, created_at, parent_plant_id, soil_type, bed, map_x, map_y, season_start_month, season_end_month, retired_at, retirement_note, acquired_on";

export type EventKind =
  | "watered"
  | "fertilized"
  | "repotted"
  | "pruned"
  | "pest_treatment"
  | "cost"
  | "harvest"
  | "note";

export type PlantEvent = {
  id: string;
  plant_id: string;
  kind: EventKind;
  occurred_on: string;
  note: string | null;
  product: string | null;
  cost: number | null;
  currency: string;
  yield_amount: number | null;
  yield_unit: string | null;
  effectiveness: number | null;
  created_at: string;
};

export type PlantPhoto = {
  id: string;
  plant_id: string;
  image_url: string;
  caption: string | null;
  taken_at: string;
  created_at: string;
};

export const EVENT_LABELS: Record<EventKind, string> = {
  watered: "Watered",
  fertilized: "Fertilized",
  repotted: "Repotted",
  pruned: "Pruned",
  pest_treatment: "Pest treatment",
  cost: "Money spent",
  harvest: "Harvest",
  note: "Note",
};

export const CARE_INTERVALS: Partial<Record<EventKind, number>> = {
  watered: 3,
  fertilized: 30,
  repotted: 180,
  pruned: 60,
};

export const SOIL_TYPES = [
  "Potting mix",
  "Cactus / succulent mix",
  "Coco peat",
  "Loam",
  "Sandy",
  "Clay",
  "Raised bed compost",
  "Hydroponic",
];

export const TAG_SUGGESTIONS = ["indoor", "outdoor", "gift", "for sale", "edible", "needs care"];
export const LOCATION_SUGGESTIONS = [
  "Balcony",
  "Kitchen window",
  "Living room",
  "Backyard bed",
  "Greenhouse",
  "Terrace",
];

export const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function displayName(p: { name: string; nickname?: string | null }) {
  return p.nickname?.trim() ? p.nickname : p.name;
}

export function parseTags(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

export function daysAgo(dateStr: string): number {
  const d = new Date(dateStr);
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/** Composite 0–100 health score built from care recency, pest history and harvests. */
export function healthScore(
  plant: GardenPlant,
  events: PlantEvent[]
): { score: number; label: string; reasons: string[] } {
  const reasons: string[] = [];
  let score = 70;

  if (plant.retired_at) return { score: 0, label: "Retired", reasons: ["This plant has been retired."] };

  const lastOf = (kind: EventKind) => {
    const list = events.filter((e) => e.kind === kind);
    if (list.length === 0) return null;
    return list.map((e) => e.occurred_on).sort().slice(-1)[0]!;
  };

  const water = lastOf("watered");
  if (!water) {
    score -= 10;
    reasons.push("No watering logged yet.");
  } else {
    const d = daysAgo(water);
    if (d <= 3) {
      score += 15;
      reasons.push("Watered recently.");
    } else if (d <= 7) {
      score += 5;
      reasons.push(`Last watered ${d} days ago.`);
    } else {
      score -= Math.min(25, d);
      reasons.push(`Watering is ${d} days old.`);
    }
  }

  const fert = lastOf("fertilized");
  if (fert && daysAgo(fert) <= 45) {
    score += 8;
    reasons.push("Fed within the last six weeks.");
  }

  const pest = events.filter((e) => e.kind === "pest_treatment");
  if (pest.length > 0) {
    const recent = pest.filter((e) => daysAgo(e.occurred_on) <= 30);
    if (recent.length > 0) {
      score -= 12;
      reasons.push("Pest treatment in the last month.");
    }
    const rated = pest.filter((e) => e.effectiveness != null);
    if (rated.length > 0) {
      const avg = rated.reduce((s, e) => s + (e.effectiveness ?? 0), 0) / rated.length;
      score += (avg - 3) * 4;
      reasons.push(`Treatments rated ${avg.toFixed(1)}/5 on average.`);
    }
  }

  const harvests = events.filter((e) => e.kind === "harvest");
  if (harvests.length > 0) {
    score += Math.min(12, harvests.length * 3);
    reasons.push(`${harvests.length} harvest${harvests.length === 1 ? "" : "s"} logged.`);
  }

  const age = daysAgo(plant.created_at);
  if (age > 180) {
    score += 5;
    reasons.push("Thriving for more than six months.");
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const label =
    score >= 80 ? "Thriving" : score >= 60 ? "Doing well" : score >= 40 ? "Needs attention" : "Struggling";
  return { score, label, reasons };
}

/** Companion planting knowledge: keyword -> friends / foes. */
const COMPANIONS: { match: string[]; good: string[]; bad: string[] }[] = [
  { match: ["tomato"], good: ["Basil", "Marigold", "Carrot", "Onion"], bad: ["Potato", "Cabbage", "Fennel", "Corn"] },
  { match: ["basil"], good: ["Tomato", "Pepper", "Oregano"], bad: ["Rue"] },
  { match: ["pepper", "chilli", "chili"], good: ["Basil", "Onion", "Spinach"], bad: ["Fennel", "Beans"] },
  { match: ["carrot"], good: ["Onion", "Lettuce", "Rosemary", "Tomato"], bad: ["Dill", "Fennel"] },
  { match: ["cabbage", "broccoli", "cauliflower", "kale"], good: ["Onion", "Dill", "Mint", "Marigold"], bad: ["Tomato", "Strawberry", "Pole beans"] },
  { match: ["cucumber"], good: ["Beans", "Corn", "Radish", "Sunflower"], bad: ["Potato", "Aromatic herbs"] },
  { match: ["bean", "pea"], good: ["Carrot", "Cucumber", "Corn", "Radish"], bad: ["Onion", "Garlic", "Fennel"] },
  { match: ["onion", "garlic", "leek"], good: ["Carrot", "Tomato", "Lettuce"], bad: ["Beans", "Peas", "Asparagus"] },
  { match: ["potato"], good: ["Beans", "Corn", "Marigold"], bad: ["Tomato", "Cucumber", "Sunflower"] },
  { match: ["lettuce", "spinach"], good: ["Carrot", "Radish", "Onion", "Strawberry"], bad: ["Cabbage family"] },
  { match: ["strawberry"], good: ["Lettuce", "Spinach", "Borage"], bad: ["Cabbage family"] },
  { match: ["mint", "tulsi", "holy basil"], good: ["Cabbage", "Tomato"], bad: ["Other herbs in the same pot"] },
  { match: ["marigold", "nasturtium"], good: ["Almost every vegetable"], bad: ["Beans (nasturtium)"] },
  { match: ["rose"], good: ["Garlic", "Chives", "Marigold"], bad: ["Boxwood roots"] },
];

export function companionsFor(name: string): { good: string[]; bad: string[] } | null {
  const n = name.toLowerCase();
  const hit = COMPANIONS.find((c) => c.match.some((m) => n.includes(m)));
  return hit ? { good: hit.good, bad: hit.bad } : null;
}

/** Crop rotation families — same family should not follow itself in a bed. */
const FAMILIES: { match: string[]; family: string }[] = [
  { match: ["tomato", "potato", "brinjal", "eggplant", "pepper", "chilli", "chili"], family: "Nightshades" },
  { match: ["cabbage", "broccoli", "cauliflower", "kale", "radish", "mustard", "turnip"], family: "Brassicas" },
  { match: ["bean", "pea", "lentil", "groundnut", "peanut"], family: "Legumes" },
  { match: ["carrot", "coriander", "celery", "parsley", "dill", "fennel"], family: "Umbellifers" },
  { match: ["cucumber", "pumpkin", "gourd", "melon", "squash", "zucchini"], family: "Cucurbits" },
  { match: ["onion", "garlic", "leek", "chive", "shallot"], family: "Alliums" },
  { match: ["lettuce", "spinach", "amaranth", "chard", "beet"], family: "Leafy greens" },
  { match: ["corn", "maize", "wheat", "rice", "millet"], family: "Grasses" },
];

export const ROTATION_ORDER = ["Legumes", "Leafy greens", "Nightshades", "Cucurbits", "Brassicas", "Alliums"];

export function familyFor(name: string, species?: string | null): string {
  const n = `${name} ${species ?? ""}`.toLowerCase();
  const hit = FAMILIES.find((f) => f.match.some((m) => n.includes(m)));
  return hit ? hit.family : "Other";
}

export function nextRotation(family: string): string {
  const i = ROTATION_ORDER.indexOf(family);
  if (i === -1) return "Legumes (peas or beans) to rebuild the soil";
  return ROTATION_ORDER[(i + 1) % ROTATION_ORDER.length]!;
}

/** Default growing season by category, used when a plant has no custom season. */
export function defaultSeason(categoryOrName: string): [number, number] {
  const n = (categoryOrName ?? "").toLowerCase();
  if (n.includes("house") || n.includes("indoor") || n.includes("succulent")) return [1, 12];
  if (n.includes("herb")) return [3, 11];
  if (n.includes("flower")) return [3, 10];
  if (n.includes("fruit")) return [2, 11];
  if (n.includes("veg")) return [6, 11];
  return [3, 10];
}

export function seasonOf(p: GardenPlant): [number, number] {
  if (p.season_start_month && p.season_end_month) return [p.season_start_month, p.season_end_month];
  return defaultSeason(p.category ?? p.name);
}

export function inSeason(p: GardenPlant, month: number): boolean {
  const [a, b] = seasonOf(p);
  return a <= b ? month >= a && month <= b : month >= a || month <= b;
}
