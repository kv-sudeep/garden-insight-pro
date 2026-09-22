import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Sprout,
  Trash2,
  Pencil,
  Check,
  X,
  Search,
  Droplets,
  FlowerIcon,
  Sparkles,
  Bell,
  CheckSquare,
  Square,
  Plus,
  Archive,
  ArchiveRestore,
  MapPin,
  Tag,
} from "lucide-react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/device";
import { toast } from "sonner";

export const Route = createFileRoute("/garden")({
  head: () => ({
    meta: [
      { title: "My Garden — Plant Doctor" },
      {
        name: "description",
        content:
          "Track the plants you care for: nicknames, labels, where they live, care logs and reminders.",
      },
      { property: "og:title", content: "My Garden — Plant Doctor" },
      {
        property: "og:description",
        content: "Add plants by hand or from a scan, label them, and archive the ones that are gone.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Garden,
});

type Plant = {
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
};

const SELECT_COLS =
  "id, name, nickname, species, image_url, notes, category, location, tags, archived_at, created_at";

type SortKey = "newest" | "oldest" | "name-asc" | "name-desc";
type ActionKey = "Watered" | "Repotted" | "Fertilized";

const ACTIONS: { label: ActionKey; icon: typeof Droplets; intervalDays: number }[] = [
  { label: "Watered", icon: Droplets, intervalDays: 3 },
  { label: "Repotted", icon: FlowerIcon, intervalDays: 180 },
  { label: "Fertilized", icon: Sparkles, intervalDays: 30 },
];

const TAG_SUGGESTIONS = ["indoor", "outdoor", "gift", "for sale", "edible", "needs care"];
const LOCATION_SUGGESTIONS = [
  "Balcony",
  "Kitchen window",
  "Living room",
  "Backyard bed",
  "Greenhouse",
  "Terrace",
];

function todayStr() {
  return new Date().toLocaleDateString();
}

function buildNoteLine(action: ActionKey) {
  return `${action} on ${todayStr()}`;
}

function lastActionDate(notes: string | null, action: ActionKey): Date | null {
  if (!notes) return null;
  const re = new RegExp(`${action} on ([^\\n]+)`, "gi");
  let last: Date | null = null;
  for (const m of notes.matchAll(re)) {
    const d = new Date(m[1].trim());
    if (!isNaN(d.getTime())) last = d;
  }
  return last;
}

function daysUntil(from: Date, intervalDays: number): number {
  const due = new Date(from);
  due.setDate(due.getDate() + intervalDays);
  return Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function parseTags(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

function displayName(p: Plant) {
  return p.nickname?.trim() ? p.nickname : p.name;
}

function Garden() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    name: "",
    nickname: "",
    location: "",
    tags: "",
    notes: "",
  });
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [activeCat, setActiveCat] = useState<string>("All");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newPlant, setNewPlant] = useState({
    name: "",
    nickname: "",
    species: "",
    category: "",
    location: "",
    tags: "",
    notes: "",
  });

  async function load() {
    const { data } = await supabase
      .from("garden_plants")
      .select(SELECT_COLS)
      .eq("device_id", getDeviceId())
      .order("created_at", { ascending: false });
    setPlants((data as Plant[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const activePlants = useMemo(() => plants.filter((p) => !p.archived_at), [plants]);
  const archivedPlants = useMemo(() => plants.filter((p) => p.archived_at), [plants]);
  const pool = showArchived ? archivedPlants : activePlants;

  async function addPlant() {
    const name = newPlant.name.trim();
    if (!name) {
      toast.error("Give your plant a name first.");
      return;
    }
    const dupe = activePlants.find(
      (p) =>
        p.name.trim().toLowerCase() === name.toLowerCase() ||
        (p.nickname ?? "").trim().toLowerCase() === name.toLowerCase()
    );
    if (dupe && !confirm(`"${displayName(dupe)}" is already in your garden. Add another one?`)) return;

    setSaving(true);
    const row = {
      device_id: getDeviceId(),
      name,
      nickname: newPlant.nickname.trim() || null,
      species: newPlant.species.trim() || null,
      category: newPlant.category.trim() || null,
      location: newPlant.location.trim() || null,
      tags: parseTags(newPlant.tags),
      notes: newPlant.notes.trim() || null,
    };
    const { data, error } = await supabase
      .from("garden_plants")
      .insert(row)
      .select(SELECT_COLS)
      .single();
    setSaving(false);
    if (error) return toast.error(error.message);
    setPlants((ps) => [data as Plant, ...ps]);
    setNewPlant({ name: "", nickname: "", species: "", category: "", location: "", tags: "", notes: "" });
    setAdding(false);
    setShowArchived(false);
    toast.success(`${name} added to your garden`);
  }

  async function archive(p: Plant) {
    const stamp = new Date().toISOString();
    const { error } = await supabase
      .from("garden_plants")
      .update({ archived_at: stamp })
      .eq("id", p.id);
    if (error) return toast.error(error.message);
    setPlants((ps) => ps.map((x) => (x.id === p.id ? { ...x, archived_at: stamp } : x)));
    toast(`${displayName(p)} archived`, {
      duration: 6000,
      action: { label: "Undo", onClick: () => restore(p) },
    });
  }

  async function restore(p: Plant) {
    const { error } = await supabase
      .from("garden_plants")
      .update({ archived_at: null })
      .eq("id", p.id);
    if (error) return toast.error(error.message);
    setPlants((ps) => ps.map((x) => (x.id === p.id ? { ...x, archived_at: null } : x)));
    toast.success(`${displayName(p)} is back in your garden`);
  }

  async function remove(p: Plant) {
    if (!confirm(`Delete ${displayName(p)} permanently? Archive keeps its history instead.`)) return;
    const { error } = await supabase.from("garden_plants").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    setPlants((ps) => ps.filter((x) => x.id !== p.id));
    toast.success("Deleted");
  }

  function startEdit(p: Plant) {
    setEditingId(p.id);
    setDraft({
      name: p.name,
      nickname: p.nickname ?? "",
      location: p.location ?? "",
      tags: (p.tags ?? []).join(", "),
      notes: p.notes ?? "",
    });
  }

  function appendTemplate(text: string) {
    setDraft((d) => ({ ...d, notes: d.notes.trim() ? `${d.notes.trim()}\n${text}` : text }));
  }

  async function saveEdit(id: string) {
    const patch = {
      name: draft.name.trim() || "My plant",
      nickname: draft.nickname.trim() || null,
      location: draft.location.trim() || null,
      tags: parseTags(draft.tags),
      notes: draft.notes.trim() || null,
    };
    const { error } = await supabase.from("garden_plants").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    setPlants((ps) => ps.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    setEditingId(null);
    toast.success("Saved");
  }

  async function quickAction(p: Plant, action: ActionKey) {
    const line = buildNoteLine(action);
    const newNotes = p.notes?.trim() ? `${p.notes.trim()}\n${line}` : line;
    const { error } = await supabase.from("garden_plants").update({ notes: newNotes }).eq("id", p.id);
    if (error) return toast.error(error.message);
    setPlants((ps) => ps.map((x) => (x.id === p.id ? { ...x, notes: newNotes } : x)));
    toast.success(`${action} logged`);
  }

  function toggleSelect(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function toggleSelectAll(visibleIds: string[]) {
    setSelected((s) => (visibleIds.every((id) => s.has(id)) ? new Set() : new Set(visibleIds)));
  }

  async function bulkArchive() {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    const stamp = new Date().toISOString();
    const { error } = await supabase.from("garden_plants").update({ archived_at: stamp }).in("id", ids);
    if (error) return toast.error(error.message);
    setPlants((ps) => ps.map((x) => (selected.has(x.id) ? { ...x, archived_at: stamp } : x)));
    setSelected(new Set());
    setSelecting(false);
    toast(`Archived ${ids.length} plant${ids.length === 1 ? "" : "s"}`, {
      duration: 6000,
      action: {
        label: "Undo",
        onClick: async () => {
          const { error: e } = await supabase
            .from("garden_plants")
            .update({ archived_at: null })
            .in("id", ids);
          if (e) return toast.error(e.message);
          setPlants((ps) => ps.map((x) => (ids.includes(x.id) ? { ...x, archived_at: null } : x)));
          toast.success("Restored");
        },
      },
    });
  }

  async function bulkRestore() {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    const { error } = await supabase.from("garden_plants").update({ archived_at: null }).in("id", ids);
    if (error) return toast.error(error.message);
    setPlants((ps) => ps.map((x) => (ids.includes(x.id) ? { ...x, archived_at: null } : x)));
    setSelected(new Set());
    setSelecting(false);
    toast.success(`Restored ${ids.length} plant${ids.length === 1 ? "" : "s"}`);
  }

  async function bulkDelete() {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    const removed = plants.filter((p) => selected.has(p.id));
    const { error } = await supabase.from("garden_plants").delete().in("id", ids);
    if (error) return toast.error(error.message);
    setPlants((p) => p.filter((x) => !selected.has(x.id)));
    setSelected(new Set());
    setSelecting(false);
    toast(`Deleted ${removed.length} plant${removed.length === 1 ? "" : "s"}`, {
      duration: 6000,
      action: {
        label: "Undo",
        onClick: async () => {
          const rows = removed.map((r) => ({
            ...r,
            tags: r.tags ?? [],
            device_id: getDeviceId(),
          }));
          const { error: insErr } = await supabase.from("garden_plants").insert(rows);
          if (insErr) return toast.error(insErr.message);
          setPlants((ps) =>
            [...removed, ...ps].sort((a, b) => b.created_at.localeCompare(a.created_at))
          );
          toast.success("Restored");
        },
      },
    });
  }

  async function bulkAction(action: ActionKey) {
    if (selected.size === 0) return;
    const line = buildNoteLine(action);
    const targets = plants.filter((p) => selected.has(p.id));
    const updates = await Promise.all(
      targets.map((p) => {
        const newNotes = p.notes?.trim() ? `${p.notes.trim()}\n${line}` : line;
        return supabase
          .from("garden_plants")
          .update({ notes: newNotes })
          .eq("id", p.id)
          .then(() => ({ id: p.id, newNotes }));
      })
    );
    const map = new Map(updates.map((u) => [u.id, u.newNotes]));
    setPlants((ps) => ps.map((x) => (map.has(x.id) ? { ...x, notes: map.get(x.id)! } : x)));
    toast.success(`${action} logged for ${selected.size}`);
    setSelected(new Set());
    setSelecting(false);
  }

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    pool.forEach((p) => {
      if (p.category) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    });
    const cats = Array.from(counts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
    return [{ name: "All", count: pool.length }, ...cats];
  }, [pool]);

  const tagList = useMemo(() => {
    const counts = new Map<string, number>();
    pool.forEach((p) => (p.tags ?? []).forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
    return Array.from(counts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }, [pool]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = pool;
    if (activeCat !== "All") list = list.filter((p) => (p.category ?? "") === activeCat);
    if (activeTag) list = list.filter((p) => (p.tags ?? []).includes(activeTag));
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.nickname ?? "").toLowerCase().includes(q) ||
          (p.species ?? "").toLowerCase().includes(q) ||
          (p.location ?? "").toLowerCase().includes(q) ||
          (p.tags ?? []).some((t) => t.includes(q)) ||
          (p.notes ?? "").toLowerCase().includes(q)
      );
    }
    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sort) {
        case "oldest":
          return a.created_at.localeCompare(b.created_at);
        case "name-asc":
          return displayName(a).localeCompare(displayName(b));
        case "name-desc":
          return displayName(b).localeCompare(displayName(a));
        default:
          return b.created_at.localeCompare(a.created_at);
      }
    });
    return sorted;
  }, [pool, query, sort, activeCat, activeTag]);

  const reminders = useMemo(() => {
    const items: { plant: Plant; action: ActionKey; daysLeft: number }[] = [];
    for (const p of activePlants) {
      for (const a of ACTIONS) {
        const last = lastActionDate(p.notes, a.label);
        if (!last) continue;
        const daysLeft = daysUntil(last, a.intervalDays);
        if (daysLeft <= 3) items.push({ plant: p, action: a.label, daysLeft });
      }
    }
    return items.sort((x, y) => x.daysLeft - y.daysLeft).slice(0, 5);
  }, [activePlants]);

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: "newest", label: "Newest" },
    { key: "oldest", label: "Oldest" },
    { key: "name-asc", label: "A–Z" },
    { key: "name-desc", label: "Z–A" },
  ];

  const visibleIds = visible.map((p) => p.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));

  return (
    <MobileLayout>
      <div className="px-6 pt-10 pb-24">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">My garden</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {activePlants.length} plant{activePlants.length === 1 ? "" : "s"}
              {archivedPlants.length > 0 && ` · ${archivedPlants.length} archived`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {pool.length > 0 && (
              <button
                onClick={() => {
                  setSelecting((s) => !s);
                  setSelected(new Set());
                }}
                className="rounded-full bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-soft hover:bg-secondary"
              >
                {selecting ? "Done" : "Select"}
              </button>
            )}
            <button
              onClick={() => setAdding((a) => !a)}
              className="inline-flex items-center gap-1 rounded-full bg-leaf px-3 py-1.5 text-xs font-semibold text-leaf-foreground shadow-leaf hover:bg-leaf/90"
            >
              <Plus className="h-3.5 w-3.5" />
              Add plant
            </button>
          </div>
        </div>

        {/* Manual add form */}
        {adding && (
          <div className="mt-5 space-y-2 rounded-3xl bg-card p-4 shadow-soft">
            <div className="text-sm font-semibold">Add a plant by hand</div>
            <Input
              value={newPlant.name}
              onChange={(e) => setNewPlant({ ...newPlant, name: e.target.value })}
              placeholder="Plant name (e.g. Tomato)"
              className="h-11 rounded-2xl"
            />
            <Input
              value={newPlant.nickname}
              onChange={(e) => setNewPlant({ ...newPlant, nickname: e.target.value })}
              placeholder="Nickname (e.g. Big Red) — optional"
              className="h-11 rounded-2xl"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={newPlant.species}
                onChange={(e) => setNewPlant({ ...newPlant, species: e.target.value })}
                placeholder="Species"
                className="h-11 rounded-2xl"
              />
              <Input
                value={newPlant.category}
                onChange={(e) => setNewPlant({ ...newPlant, category: e.target.value })}
                placeholder="Category"
                className="h-11 rounded-2xl"
              />
            </div>
            <Input
              value={newPlant.location}
              onChange={(e) => setNewPlant({ ...newPlant, location: e.target.value })}
              placeholder="Where it lives (e.g. Kitchen window)"
              className="h-11 rounded-2xl"
            />
            <div className="flex flex-wrap gap-1.5">
              {LOCATION_SUGGESTIONS.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setNewPlant({ ...newPlant, location: l })}
                  className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium hover:bg-leaf hover:text-leaf-foreground"
                >
                  {l}
                </button>
              ))}
            </div>
            <Input
              value={newPlant.tags}
              onChange={(e) => setNewPlant({ ...newPlant, tags: e.target.value })}
              placeholder="Labels, comma separated (indoor, gift…)"
              className="h-11 rounded-2xl"
            />
            <div className="flex flex-wrap gap-1.5">
              {TAG_SUGGESTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() =>
                    setNewPlant((n) => ({
                      ...n,
                      tags: parseTags(`${n.tags},${t}`).join(", "),
                    }))
                  }
                  className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium hover:bg-leaf hover:text-leaf-foreground"
                >
                  #{t}
                </button>
              ))}
            </div>
            <Textarea
              value={newPlant.notes}
              onChange={(e) => setNewPlant({ ...newPlant, notes: e.target.value })}
              placeholder="Notes (optional)"
              rows={2}
              className="rounded-2xl text-sm"
            />
            <div className="flex gap-2 pt-1">
              <Button
                onClick={addPlant}
                disabled={saving}
                className="flex-1 rounded-2xl bg-leaf text-leaf-foreground hover:bg-leaf/90"
              >
                {saving ? "Adding…" : "Add to garden"}
              </Button>
              <Button variant="ghost" className="rounded-2xl" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {reminders.length > 0 && !showArchived && (
          <div className="mt-5 rounded-2xl border border-border bg-card p-4 shadow-soft">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Bell className="h-4 w-4 text-leaf" />
              Upcoming care
            </div>
            <ul className="space-y-1.5">
              {reminders.map((r, i) => {
                const Icon = ACTIONS.find((a) => a.label === r.action)!.icon;
                const overdue = r.daysLeft < 0;
                const today = r.daysLeft === 0;
                return (
                  <li key={i} className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex min-w-0 items-center gap-2">
                      <Icon className="h-3.5 w-3.5 flex-shrink-0 text-leaf" />
                      <span className="truncate">
                        <span className="font-medium">{displayName(r.plant)}</span>{" "}
                        <span className="text-muted-foreground">— {r.action.toLowerCase()}</span>
                      </span>
                    </span>
                    <span
                      className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        overdue
                          ? "bg-danger/10 text-danger"
                          : today
                            ? "bg-leaf/15 text-leaf"
                            : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {overdue ? `${-r.daysLeft}d overdue` : today ? "today" : `in ${r.daysLeft}d`}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Active / Archived switch */}
        {archivedPlants.length > 0 && (
          <div className="mt-4 inline-flex rounded-full bg-card p-1 shadow-soft">
            {[
              { key: false, label: `Growing (${activePlants.length})` },
              { key: true, label: `Archived (${archivedPlants.length})` },
            ].map((t) => (
              <button
                key={String(t.key)}
                onClick={() => {
                  setShowArchived(t.key);
                  setSelected(new Set());
                  setActiveCat("All");
                  setActiveTag(null);
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  showArchived === t.key
                    ? "bg-leaf text-leaf-foreground"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {pool.length > 0 && (
          <>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, label, spot or notes…"
                className="h-12 rounded-2xl border-border bg-card pl-10"
              />
            </div>
            {categories.length > 1 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setActiveCat(c.name)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      activeCat === c.name
                        ? "bg-leaf text-leaf-foreground"
                        : "bg-card text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {c.name}
                    <span
                      className={`rounded-full px-1.5 text-[10px] ${
                        activeCat === c.name
                          ? "bg-leaf-foreground/20 text-leaf-foreground"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {c.count}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {tagList.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {tagList.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => setActiveTag(activeTag === t.name ? null : t.name)}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      activeTag === t.name
                        ? "bg-leaf text-leaf-foreground"
                        : "bg-card text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <Tag className="h-3 w-3" />
                    {t.name}
                    <span className="text-[10px] opacity-70">{t.count}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {sortOptions.map((o) => (
                <button
                  key={o.key}
                  onClick={() => setSort(o.key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    sort === o.key
                      ? "bg-leaf text-leaf-foreground"
                      : "bg-card text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </>
        )}

        {selecting && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl bg-card p-3 shadow-soft">
            <button
              onClick={() => toggleSelectAll(visibleIds)}
              className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-secondary/80"
            >
              {allSelected ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
              {allSelected ? "Unselect all" : "Select all"}
            </button>
            <span className="text-xs text-muted-foreground">{selected.size} selected</span>
            <div className="ml-auto flex flex-wrap gap-1.5">
              {!showArchived &&
                ACTIONS.map((a) => {
                  const Icon = a.icon;
                  return (
                    <button
                      key={a.label}
                      disabled={selected.size === 0}
                      onClick={() => bulkAction(a.label)}
                      className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium hover:bg-leaf hover:text-leaf-foreground disabled:opacity-40"
                    >
                      <Icon className="h-3 w-3" />
                      {a.label}
                    </button>
                  );
                })}
              {showArchived ? (
                <button
                  disabled={selected.size === 0}
                  onClick={bulkRestore}
                  className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium hover:bg-leaf hover:text-leaf-foreground disabled:opacity-40"
                >
                  <ArchiveRestore className="h-3 w-3" />
                  Restore
                </button>
              ) : (
                <button
                  disabled={selected.size === 0}
                  onClick={bulkArchive}
                  className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium hover:bg-leaf hover:text-leaf-foreground disabled:opacity-40"
                >
                  <Archive className="h-3 w-3" />
                  Archive
                </button>
              )}
              <button
                disabled={selected.size === 0}
                onClick={bulkDelete}
                className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2.5 py-1 text-[11px] font-medium text-danger hover:bg-danger hover:text-danger-foreground disabled:opacity-40"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Loading…</div>
        ) : pool.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-border bg-card p-8 text-center">
            <Sprout className="mx-auto h-12 w-12 text-leaf" />
            <p className="mt-3 text-sm text-muted-foreground">
              {showArchived
                ? "Nothing archived yet."
                : "Your garden is empty. Add a plant by hand or scan one."}
            </p>
            {!showArchived && (
              <div className="mt-4 flex justify-center gap-2">
                <Button
                  className="rounded-full bg-leaf text-leaf-foreground hover:bg-leaf/90"
                  onClick={() => setAdding(true)}
                >
                  Add a plant
                </Button>
                <Link to="/scan">
                  <Button variant="outline" className="rounded-full">
                    Scan a plant
                  </Button>
                </Link>
              </div>
            )}
          </div>
        ) : visible.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No plants match your filters.
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {visible.map((p) => {
              const isEditing = editingId === p.id;
              const isSelected = selected.has(p.id);
              return (
                <div
                  key={p.id}
                  className={`rounded-2xl bg-card p-3 shadow-soft transition-colors ${
                    isSelected ? "ring-2 ring-leaf" : ""
                  } ${p.archived_at ? "opacity-70" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    {selecting && (
                      <button
                        onClick={() => toggleSelect(p.id)}
                        className="mt-1 flex-shrink-0"
                        aria-label="Select plant"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-5 w-5 text-leaf" />
                        ) : (
                          <Square className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>
                    )}
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-secondary">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={displayName(p)}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Sprout className="mx-auto mt-5 h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            value={draft.name}
                            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                            placeholder="Plant name"
                            className="h-9 rounded-xl text-sm"
                          />
                          <Input
                            value={draft.nickname}
                            onChange={(e) => setDraft({ ...draft, nickname: e.target.value })}
                            placeholder="Nickname"
                            className="h-9 rounded-xl text-sm"
                          />
                          <Input
                            value={draft.location}
                            onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                            placeholder="Where it lives"
                            className="h-9 rounded-xl text-sm"
                          />
                          <Input
                            value={draft.tags}
                            onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
                            placeholder="Labels, comma separated"
                            className="h-9 rounded-xl text-sm"
                          />
                          <div className="flex flex-wrap gap-1.5">
                            {TAG_SUGGESTIONS.map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() =>
                                  setDraft((d) => ({ ...d, tags: parseTags(`${d.tags},${t}`).join(", ") }))
                                }
                                className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium hover:bg-leaf hover:text-leaf-foreground"
                              >
                                #{t}
                              </button>
                            ))}
                          </div>
                          <Textarea
                            value={draft.notes}
                            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                            placeholder="Notes (e.g. last watered, issues…)"
                            rows={3}
                            className="text-sm"
                          />
                          <div className="flex flex-wrap gap-1.5">
                            <span className="self-center text-[10px] uppercase tracking-wider text-muted-foreground">
                              Quick add:
                            </span>
                            {ACTIONS.map((t) => {
                              const Icon = t.icon;
                              return (
                                <button
                                  key={t.label}
                                  type="button"
                                  onClick={() => appendTemplate(buildNoteLine(t.label))}
                                  className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-leaf hover:text-leaf-foreground"
                                >
                                  <Icon className="h-3 w-3" />
                                  {t.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate font-semibold">{displayName(p)}</span>
                            {p.nickname?.trim() && (
                              <span className="truncate text-xs text-muted-foreground">({p.name})</span>
                            )}
                            {p.category && (
                              <span className="flex-shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                                {p.category}
                              </span>
                            )}
                            {p.archived_at && (
                              <span className="flex-shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                                archived
                              </span>
                            )}
                          </div>
                          {p.species && (
                            <div className="truncate text-xs text-muted-foreground">{p.species}</div>
                          )}
                          {p.location && (
                            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 text-leaf" />
                              {p.location}
                            </div>
                          )}
                          {(p.tags ?? []).length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {(p.tags ?? []).map((t) => (
                                <span
                                  key={t}
                                  className="rounded-full bg-leaf/10 px-2 py-0.5 text-[10px] font-medium text-leaf"
                                >
                                  #{t}
                                </span>
                              ))}
                            </div>
                          )}
                          {p.notes && (
                            <div className="mt-1 line-clamp-3 whitespace-pre-line text-xs text-muted-foreground">
                              {p.notes}
                            </div>
                          )}
                          {!selecting && !p.archived_at && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {ACTIONS.map((a) => {
                                const Icon = a.icon;
                                return (
                                  <button
                                    key={a.label}
                                    onClick={() => quickAction(p, a.label)}
                                    className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium hover:bg-leaf hover:text-leaf-foreground"
                                  >
                                    <Icon className="h-3 w-3" />
                                    {a.label}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    {!selecting && (
                      <div className="flex flex-col gap-1">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveEdit(p.id)}
                              className="rounded-full p-2 text-success hover:bg-success/10"
                              aria-label="Save"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="rounded-full p-2 text-muted-foreground hover:bg-secondary"
                              aria-label="Cancel"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(p)}
                              className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-leaf"
                              aria-label="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            {p.archived_at ? (
                              <button
                                onClick={() => restore(p)}
                                className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-leaf"
                                aria-label="Restore"
                              >
                                <ArchiveRestore className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => archive(p)}
                                className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-leaf"
                                aria-label="Archive"
                              >
                                <Archive className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => remove(p)}
                              className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-danger"
                              aria-label="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
