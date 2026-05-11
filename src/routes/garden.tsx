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
      { name: "description", content: "Track plants you care for and their latest scans." },
    ],
  }),
  component: Garden,
});

type Plant = {
  id: string;
  name: string;
  species: string | null;
  image_url: string | null;
  notes: string | null;
  category: string | null;
  created_at: string;
};

type SortKey = "newest" | "oldest" | "name-asc" | "name-desc";
type ActionKey = "Watered" | "Repotted" | "Fertilized";

const ACTIONS: { label: ActionKey; icon: typeof Droplets; intervalDays: number }[] = [
  { label: "Watered", icon: Droplets, intervalDays: 3 },
  { label: "Repotted", icon: FlowerIcon, intervalDays: 180 },
  { label: "Fertilized", icon: Sparkles, intervalDays: 30 },
];

function todayStr() {
  return new Date().toLocaleDateString();
}

function buildNoteLine(action: ActionKey) {
  return `${action} on ${todayStr()}`;
}

// Parse last "<Action> on <date>" from notes
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
  const ms = due.getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function Garden() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftNotes, setDraftNotes] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [activeCat, setActiveCat] = useState<string>("All");
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  async function load() {
    const { data } = await supabase
      .from("garden_plants")
      .select("id, name, species, image_url, notes, category, created_at")
      .eq("device_id", getDeviceId())
      .order("created_at", { ascending: false });
    setPlants((data as Plant[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    if (!confirm("Remove this plant from your garden?")) return;
    const { error } = await supabase.from("garden_plants").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setPlants((p) => p.filter((x) => x.id !== id));
    toast.success("Removed");
  }

  function startEdit(p: Plant) {
    setEditingId(p.id);
    setDraftName(p.name);
    setDraftNotes(p.notes ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function appendTemplate(text: string) {
    setDraftNotes((prev) => (prev.trim() ? `${prev.trim()}\n${text}` : text));
  }

  async function saveEdit(id: string) {
    const { error } = await supabase
      .from("garden_plants")
      .update({ name: draftName.trim() || "My plant", notes: draftNotes.trim() || null })
      .eq("id", id);
    if (error) return toast.error(error.message);
    setPlants((ps) =>
      ps.map((x) =>
        x.id === id ? { ...x, name: draftName.trim() || "My plant", notes: draftNotes.trim() || null } : x
      )
    );
    setEditingId(null);
    toast.success("Saved");
  }

  // One-tap quick action: append a note line directly to the plant
  async function quickAction(p: Plant, action: ActionKey) {
    const line = buildNoteLine(action);
    const newNotes = p.notes?.trim() ? `${p.notes.trim()}\n${line}` : line;
    const { error } = await supabase
      .from("garden_plants")
      .update({ notes: newNotes })
      .eq("id", p.id);
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
    setSelected((s) => {
      if (visibleIds.every((id) => s.has(id))) return new Set();
      return new Set(visibleIds);
    });
  }

  async function bulkDelete() {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    const removed = plants.filter((p) => selected.has(p.id));
    const { error } = await supabase.from("garden_plants").delete().in("id", ids);
    if (error) return toast.error(error.message);
    setPlants((p) => p.filter((x) => !selected.has(x.id)));
    setSelected(new Set());
    toast(`Removed ${removed.length} plant${removed.length === 1 ? "" : "s"}`, {
      duration: 6000,
      action: {
        label: "Undo",
        onClick: async () => {
          const rows = removed.map((r) => ({
            id: r.id,
            name: r.name,
            species: r.species,
            image_url: r.image_url,
            notes: r.notes,
            category: r.category,
            created_at: r.created_at,
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
    setSelecting(false);
    toast.success("Removed");
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
    plants.forEach((p) => {
      if (p.category) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    });
    const cats = Array.from(counts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
    return [{ name: "All", count: plants.length }, ...cats];
  }, [plants]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = plants;
    if (activeCat !== "All") {
      list = list.filter((p) => (p.category ?? "") === activeCat);
    }
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.species ?? "").toLowerCase().includes(q) ||
          (p.notes ?? "").toLowerCase().includes(q)
      );
    }
    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sort) {
        case "oldest":
          return a.created_at.localeCompare(b.created_at);
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "newest":
        default:
          return b.created_at.localeCompare(a.created_at);
      }
    });
    return sorted;
  }, [plants, query, sort, activeCat]);

  // Upcoming reminders (due within 3 days or overdue)
  const reminders = useMemo(() => {
    const items: { plant: Plant; action: ActionKey; daysLeft: number }[] = [];
    for (const p of plants) {
      for (const a of ACTIONS) {
        const last = lastActionDate(p.notes, a.label);
        if (!last) continue;
        const daysLeft = daysUntil(last, a.intervalDays);
        if (daysLeft <= 3) items.push({ plant: p, action: a.label, daysLeft });
      }
    }
    return items.sort((x, y) => x.daysLeft - y.daysLeft).slice(0, 5);
  }, [plants]);

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
              {plants.length} plant{plants.length === 1 ? "" : "s"}
            </p>
          </div>
          {plants.length > 0 && (
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
        </div>

        {reminders.length > 0 && (
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
                        <span className="font-medium">{r.plant.name}</span>{" "}
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

        {plants.length > 0 && (
          <>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or notes…"
                className="h-12 rounded-2xl border-border bg-card pl-10"
              />
            </div>
            {categories.length > 1 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setActiveCat(c)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      activeCat === c
                        ? "bg-leaf text-leaf-foreground"
                        : "bg-card text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {c}
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
              {ACTIONS.map((a) => {
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
        ) : plants.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-border bg-card p-8 text-center">
            <Sprout className="mx-auto h-12 w-12 text-leaf" />
            <p className="mt-3 text-sm text-muted-foreground">
              Your garden is empty. Scan a plant and add it here.
            </p>
            <Link to="/scan">
              <Button className="mt-4 rounded-full bg-leaf text-leaf-foreground hover:bg-leaf/90">
                Scan a plant
              </Button>
            </Link>
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
                  }`}
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
                      {p.image_url && (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            value={draftName}
                            onChange={(e) => setDraftName(e.target.value)}
                            placeholder="Plant name"
                            className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                          />
                          <Textarea
                            value={draftNotes}
                            onChange={(e) => setDraftNotes(e.target.value)}
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
                          <div className="flex items-center gap-2">
                            <span className="truncate font-semibold">{p.name}</span>
                            {p.category && (
                              <span className="flex-shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                                {p.category}
                              </span>
                            )}
                          </div>
                          {p.species && (
                            <div className="truncate text-xs text-muted-foreground">{p.species}</div>
                          )}
                          {p.notes && (
                            <div className="mt-1 line-clamp-3 whitespace-pre-line text-xs text-muted-foreground">
                              {p.notes}
                            </div>
                          )}
                          {!selecting && (
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
                              onClick={cancelEdit}
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
                            <button
                              onClick={() => remove(p.id)}
                              className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-danger"
                              aria-label="Remove"
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
