import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Camera, GitBranch, Heart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/device";
import {
  CARE_INTERVALS,
  EVENT_LABELS,
  MONTHS,
  PLANT_COLS,
  SOIL_TYPES,
  companionsFor,
  daysAgo,
  displayName,
  familyFor,
  healthScore,
  nextRotation,
  seasonOf,
  todayISO,
  type EventKind,
  type GardenPlant,
  type PlantEvent,
  type PlantPhoto,
} from "@/lib/garden";

export const Route = createFileRoute("/garden/$plantId")({
  head: () => ({
    meta: [
      { title: "Plant details — KrushiMitra AI" },
      { name: "description", content: "Health score, growth photos, care history, costs and harvests for one plant." },
      { property: "og:title", content: "Plant details — KrushiMitra AI" },
      { property: "og:description", content: "Everything about one plant in your garden." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlantDetail,
});

const LOG_KINDS: EventKind[] = ["watered", "fertilized", "repotted", "pruned", "pest_treatment", "cost", "harvest", "note"];

function PlantDetail() {
  const { plantId } = Route.useParams();
  const navigate = useNavigate();
  const deviceId = getDeviceId();
  const [plant, setPlant] = useState<GardenPlant | null>(null);
  const [all, setAll] = useState<GardenPlant[]>([]);
  const [events, setEvents] = useState<PlantEvent[]>([]);
  const [photos, setPhotos] = useState<PlantPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState<EventKind>("watered");
  const [form, setForm] = useState({ date: todayISO(), note: "", product: "", cost: "", amount: "", unit: "g", rating: 0 });
  const [filter, setFilter] = useState<EventKind | "all">("all");
  const [uploading, setUploading] = useState(false);

  async function load() {
    const [p, a, e, ph] = await Promise.all([
      supabase.from("garden_plants").select(PLANT_COLS).eq("id", plantId).maybeSingle(),
      supabase.from("garden_plants").select(PLANT_COLS).eq("device_id", deviceId),
      supabase.from("plant_events").select("*").eq("plant_id", plantId).order("occurred_on", { ascending: false }),
      supabase.from("plant_photos").select("*").eq("plant_id", plantId).order("taken_at", { ascending: true }),
    ]);
    setPlant((p.data as GardenPlant) ?? null);
    setAll((a.data as GardenPlant[]) ?? []);
    setEvents((e.data as PlantEvent[]) ?? []);
    setPhotos((ph.data as PlantPhoto[]) ?? []);
    setLoading(false);
  }
  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plantId]);

  const health = useMemo(() => (plant ? healthScore(plant, events) : null), [plant, events]);
  const parent = all.find((x) => x.id === plant?.parent_plant_id) ?? null;
  const children = all.filter((x) => x.parent_plant_id === plantId);
  const totalCost = events.filter((e) => e.cost).reduce((s, e) => s + Number(e.cost ?? 0), 0);
  const yields = events.filter((e) => e.kind === "harvest");
  const yieldByUnit = yields.reduce<Record<string, number>>((m, e) => {
    const u = e.yield_unit ?? "units";
    m[u] = (m[u] ?? 0) + Number(e.yield_amount ?? 0);
    return m;
  }, {});

  async function update(patch: Partial<GardenPlant>) {
    if (!plant) return;
    setPlant({ ...plant, ...patch });
    const { error } = await supabase.from("garden_plants").update(patch).eq("id", plant.id);
    if (error) toast.error("Could not save");
  }

  async function addEvent() {
    if (!plant) return;
    const row = {
      device_id: deviceId,
      plant_id: plant.id,
      kind,
      occurred_on: form.date || todayISO(),
      note: form.note.trim() || null,
      product: form.product.trim() || null,
      cost: form.cost ? Number(form.cost) : null,
      yield_amount: kind === "harvest" && form.amount ? Number(form.amount) : null,
      yield_unit: kind === "harvest" ? form.unit : null,
      effectiveness: kind === "pest_treatment" && form.rating ? form.rating : null,
    };
    const { data, error } = await supabase.from("plant_events").insert(row).select("*").single();
    if (error) return toast.error("Could not save the entry");
    setEvents((ev) => [data as PlantEvent, ...ev].sort((a, b) => b.occurred_on.localeCompare(a.occurred_on)));
    setForm({ date: todayISO(), note: "", product: "", cost: "", amount: "", unit: form.unit, rating: 0 });
    toast.success(`${EVENT_LABELS[kind]} logged`);
  }

  async function removeEvent(id: string) {
    setEvents((ev) => ev.filter((e) => e.id !== id));
    await supabase.from("plant_events").delete().eq("id", id);
  }

  async function addPhoto(file: File) {
    if (!plant) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${deviceId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("scans").upload(path, file);
      if (upErr) throw upErr;
      const url = supabase.storage.from("scans").getPublicUrl(path).data.publicUrl;
      const { data, error } = await supabase
        .from("plant_photos")
        .insert({ device_id: deviceId, plant_id: plant.id, image_url: url, taken_at: todayISO() })
        .select("*")
        .single();
      if (error) throw error;
      setPhotos((p) => [...p, data as PlantPhoto]);
      if (!plant.image_url) update({ image_url: url });
      toast.success("Photo added to the timeline");
    } catch {
      toast.error("Could not upload the photo");
    } finally {
      setUploading(false);
    }
  }

  async function removePhoto(id: string) {
    setPhotos((p) => p.filter((x) => x.id !== id));
    await supabase.from("plant_photos").delete().eq("id", id);
  }

  async function addCutting() {
    if (!plant) return;
    const { data, error } = await supabase
      .from("garden_plants")
      .insert({
        device_id: deviceId,
        name: plant.name,
        nickname: `${displayName(plant)} cutting ${children.length + 1}`,
        species: plant.species,
        category: plant.category,
        location: plant.location,
        tags: plant.tags ?? [],
        parent_plant_id: plant.id,
        acquired_on: todayISO(),
        notes: `Propagated from ${displayName(plant)} on ${todayISO()}`,
      })
      .select(PLANT_COLS)
      .single();
    if (error) return toast.error("Could not add the cutting");
    setAll((a) => [...a, data as GardenPlant]);
    toast.success("Cutting added to your garden");
  }

  if (loading)
    return (
      <MobileLayout>
        <div className="px-6 pt-10 text-sm text-muted-foreground">Loading…</div>
      </MobileLayout>
    );
  if (!plant)
    return (
      <MobileLayout>
        <div className="px-6 pt-10">
          <p className="text-sm">This plant was not found.</p>
          <Link to="/garden" className="text-sm font-semibold text-leaf">Back to garden</Link>
        </div>
      </MobileLayout>
    );

  const comp = companionsFor(`${plant.name} ${plant.species ?? ""}`);
  const family = familyFor(plant.name, plant.species);
  const [sStart, sEnd] = seasonOf(plant);
  const shown = filter === "all" ? events : events.filter((e) => e.kind === filter);
  const scoreColor = (health?.score ?? 0) >= 60 ? "bg-leaf" : (health?.score ?? 0) >= 40 ? "bg-accent" : "bg-destructive";

  return (
    <MobileLayout>
      <div className="px-6 pt-8 pb-24 space-y-5">
        <Link to="/garden" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> My garden
        </Link>

        <div className="flex items-center gap-4">
          {plant.image_url ? (
            <img src={plant.image_url} alt={displayName(plant)} className="h-20 w-20 rounded-2xl object-cover shadow-soft" />
          ) : (
            <div className="h-20 w-20 rounded-2xl bg-secondary" />
          )}
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold">{displayName(plant)}</h1>
            <p className="text-sm text-muted-foreground">
              {plant.nickname ? plant.name : plant.species ?? plant.category ?? "Plant"}
            </p>
            {plant.retired_at && (
              <span className="mt-1 inline-block rounded-full bg-secondary px-2 py-0.5 text-xs">
                Retired {new Date(plant.retired_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Health score */}
        {health && (
          <section className="rounded-3xl bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold">
                <Heart className="h-4 w-4 text-leaf" /> Health score
              </div>
              <div className="text-2xl font-bold">{health.score}</div>
            </div>
            <div className="mt-2 h-2 rounded-full bg-secondary">
              <div className={`h-2 rounded-full ${scoreColor}`} style={{ width: `${health.score}%` }} />
            </div>
            <div className="mt-1 text-sm font-medium">{health.label}</div>
            <ul className="mt-2 list-disc pl-5 text-xs text-muted-foreground">
              {health.reasons.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </section>
        )}

        {/* Growth timeline */}
        <section className="rounded-3xl bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Growth timeline</div>
            <label className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-leaf px-3 py-1.5 text-xs font-semibold text-leaf-foreground">
              <Camera className="h-3.5 w-3.5" /> {uploading ? "Uploading…" : "Add photo"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) addPhoto(f);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          {photos.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">Add a photo every few weeks to watch it grow.</p>
          ) : (
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
              {photos.map((ph) => (
                <div key={ph.id} className="relative flex-shrink-0">
                  <img src={ph.image_url} alt="" className="h-28 w-24 rounded-xl object-cover" />
                  <div className="mt-1 text-center text-[10px] text-muted-foreground">
                    {new Date(ph.taken_at).toLocaleDateString()}
                  </div>
                  <button
                    onClick={() => removePhoto(ph.id)}
                    aria-label="Remove photo"
                    className="absolute right-1 top-1 rounded-full bg-background/80 p-1"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Log entry */}
        <section className="rounded-3xl bg-card p-4 shadow-soft space-y-3">
          <div className="font-semibold">Log care, costs or harvest</div>
          <div className="flex flex-wrap gap-1.5">
            {LOG_KINDS.map((k) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className={`rounded-full px-3 py-1 text-xs ${kind === k ? "bg-leaf text-leaf-foreground" : "bg-secondary"}`}
              >
                {EVENT_LABELS[k]}
              </button>
            ))}
          </div>
          <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          {(kind === "fertilized" || kind === "pest_treatment" || kind === "cost") && (
            <Input placeholder="Product (e.g. neem oil)" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} />
          )}
          {kind !== "watered" && kind !== "note" && (
            <Input type="number" inputMode="decimal" placeholder="Cost (₹) — optional" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
          )}
          {kind === "harvest" && (
            <div className="flex gap-2">
              <Input type="number" inputMode="decimal" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              <select className="rounded-md border bg-background px-2 text-sm" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="count">count</option>
              </select>
            </div>
          )}
          {kind === "pest_treatment" && (
            <div className="flex items-center gap-1 text-sm">
              <span className="mr-2 text-muted-foreground">How well did it work?</span>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setForm({ ...form, rating: n })} className="text-xl" aria-label={`${n} stars`}>
                  {n <= form.rating ? "★" : "☆"}
                </button>
              ))}
            </div>
          )}
          <Input placeholder="Note — optional" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <Button className="w-full" onClick={addEvent}>Save entry</Button>
        </section>

        {/* Cost & yield */}
        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-3xl bg-card p-4 shadow-soft">
            <div className="text-xs text-muted-foreground">Money spent</div>
            <div className="text-xl font-bold">₹{totalCost.toFixed(0)}</div>
          </div>
          <div className="rounded-3xl bg-card p-4 shadow-soft">
            <div className="text-xs text-muted-foreground">Harvest total</div>
            <div className="text-xl font-bold">
              {Object.keys(yieldByUnit).length === 0
                ? "—"
                : Object.entries(yieldByUnit).map(([u, v]) => `${v} ${u}`).join(" · ")}
            </div>
          </div>
        </section>

        {/* History */}
        <section className="rounded-3xl bg-card p-4 shadow-soft">
          <div className="font-semibold">History</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(["all", ...LOG_KINDS] as const).map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`rounded-full px-2.5 py-0.5 text-[11px] ${filter === k ? "bg-foreground text-background" : "bg-secondary"}`}
              >
                {k === "all" ? "All" : EVENT_LABELS[k]}
              </button>
            ))}
          </div>
          {shown.length === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">Nothing logged yet.</p>
          ) : (
            <ul className="mt-3 divide-y">
              {shown.map((e) => (
                <li key={e.id} className="flex items-start justify-between gap-2 py-2 text-sm">
                  <div>
                    <div className="font-medium">
                      {EVENT_LABELS[e.kind]}
                      {e.product && ` · ${e.product}`}
                      {e.effectiveness != null && ` · ${"★".repeat(e.effectiveness)}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(e.occurred_on).toLocaleDateString()}
                      {e.cost != null && ` · ₹${e.cost}`}
                      {e.yield_amount != null && ` · ${e.yield_amount} ${e.yield_unit ?? ""}`}
                      {e.note && ` · ${e.note}`}
                    </div>
                  </div>
                  <button onClick={() => removeEvent(e.id)} aria-label="Remove entry" className="text-muted-foreground">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {Object.entries(CARE_INTERVALS).map(([k, days]) => {
            const last = events.find((e) => e.kind === k);
            if (!last) return null;
            const due = (days ?? 0) - daysAgo(last.occurred_on);
            return (
              <div key={k} className="mt-1 text-xs text-muted-foreground">
                Next {EVENT_LABELS[k as EventKind].toLowerCase()}: {due <= 0 ? "due now" : `in ${due} days`}
              </div>
            );
          })}
        </section>

        {/* Growing setup */}
        <section className="rounded-3xl bg-card p-4 shadow-soft space-y-2">
          <div className="font-semibold">Growing setup</div>
          <label className="block text-xs text-muted-foreground">Soil type</label>
          <select
            className="w-full rounded-md border bg-background p-2 text-sm"
            value={plant.soil_type ?? ""}
            onChange={(e) => update({ soil_type: e.target.value || null })}
          >
            <option value="">Not set</option>
            {SOIL_TYPES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <label className="block text-xs text-muted-foreground">Bed or pot</label>
          <Input
            defaultValue={plant.bed ?? ""}
            placeholder="e.g. Bed A, Blue pot"
            onBlur={(e) => e.target.value !== (plant.bed ?? "") && update({ bed: e.target.value.trim() || null })}
          />
          <label className="block text-xs text-muted-foreground">Growing season</label>
          <div className="flex gap-2">
            {(["season_start_month", "season_end_month"] as const).map((key, i) => (
              <select
                key={key}
                className="flex-1 rounded-md border bg-background p-2 text-sm"
                value={i === 0 ? sStart : sEnd}
                onChange={(e) => update({ [key]: Number(e.target.value) } as Partial<GardenPlant>)}
              >
                {MONTHS.map((m, idx) => <option key={m} value={idx + 1}>{m}</option>)}
              </select>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Crop family: <b>{family}</b> · Next in this bed: <b>{nextRotation(family)}</b>
          </p>
        </section>

        {/* Companions */}
        <section className="rounded-3xl bg-card p-4 shadow-soft">
          <div className="font-semibold">Companion planting</div>
          {comp ? (
            <div className="mt-2 space-y-1 text-sm">
              <div><span className="text-leaf font-medium">Grows well with:</span> {comp.good.join(", ")}</div>
              <div><span className="text-destructive font-medium">Keep away from:</span> {comp.bad.join(", ")}</div>
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">No companion tips for this plant yet.</p>
          )}
        </section>

        {/* Family tree */}
        <section className="rounded-3xl bg-card p-4 shadow-soft space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            <GitBranch className="h-4 w-4" /> Family tree
          </div>
          <label className="block text-xs text-muted-foreground">Grown from (parent plant)</label>
          <select
            className="w-full rounded-md border bg-background p-2 text-sm"
            value={plant.parent_plant_id ?? ""}
            onChange={(e) => update({ parent_plant_id: e.target.value || null })}
          >
            <option value="">None</option>
            {all.filter((x) => x.id !== plant.id && x.parent_plant_id !== plant.id).map((x) => (
              <option key={x.id} value={x.id}>{displayName(x)}</option>
            ))}
          </select>
          {parent && (
            <Link to="/garden/$plantId" params={{ plantId: parent.id }} className="block text-sm text-leaf">
              ↑ Parent: {displayName(parent)}
            </Link>
          )}
          {children.map((c) => (
            <Link key={c.id} to="/garden/$plantId" params={{ plantId: c.id }} className="block text-sm text-leaf">
              ↳ {displayName(c)}
            </Link>
          ))}
          <Button variant="secondary" className="w-full" onClick={addCutting}>Add a cutting from this plant</Button>
        </section>

        {!plant.retired_at ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate({ to: "/garden/retire/$plantId", params: { plantId: plant.id } })}
          >
            Say goodbye to this plant
          </Button>
        ) : (
          <Button variant="outline" className="w-full" onClick={() => update({ retired_at: null })}>
            Bring this plant back
          </Button>
        )}
      </div>
    </MobileLayout>
  );
}
