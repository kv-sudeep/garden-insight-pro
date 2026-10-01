import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { MobileLayout } from "@/components/MobileLayout";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/device";
import {
  MONTHS,
  PLANT_COLS,
  companionsFor,
  displayName,
  familyFor,
  inSeason,
  nextRotation,
  type GardenPlant,
} from "@/lib/garden";

export const Route = createFileRoute("/garden/tools")({
  head: () => ({
    meta: [
      { title: "Garden planner — KrushiMitra AI" },
      { name: "description", content: "Garden map, seasonal view, companion planting and crop rotation planner." },
      { property: "og:title", content: "Garden planner — KrushiMitra AI" },
      { property: "og:description", content: "Plan where and when to grow with map, season and rotation tools." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Tools,
});

type Tab = "map" | "season" | "companions" | "rotation";
const GRID = 6;

function Tools() {
  const [plants, setPlants] = useState<GardenPlant[]>([]);
  const [tab, setTab] = useState<Tab>("map");
  const [picked, setPicked] = useState<string | null>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    supabase
      .from("garden_plants")
      .select(PLANT_COLS)
      .eq("device_id", getDeviceId())
      .is("archived_at", null)
      .then(({ data }) => setPlants(((data as GardenPlant[]) ?? []).filter((p) => !p.retired_at)));
  }, []);

  async function place(x: number, y: number) {
    const occupant = plants.find((p) => p.map_x === x && p.map_y === y);
    if (!picked) {
      if (occupant) setPicked(occupant.id);
      return;
    }
    const patch = { map_x: x, map_y: y };
    setPlants((ps) =>
      ps.map((p) =>
        p.id === picked ? { ...p, ...patch } : occupant && p.id === occupant.id ? { ...p, map_x: null, map_y: null } : p
      )
    );
    if (occupant && occupant.id !== picked)
      await supabase.from("garden_plants").update({ map_x: null, map_y: null }).eq("id", occupant.id);
    await supabase.from("garden_plants").update(patch).eq("id", picked);
    setPicked(null);
  }

  const unplaced = plants.filter((p) => p.map_x == null);
  const beds = Object.entries(
    plants.reduce<Record<string, GardenPlant[]>>((m, p) => {
      const b = p.bed || p.location || "Unassigned";
      (m[b] ??= []).push(p);
      return m;
    }, {})
  );

  return (
    <MobileLayout>
      <div className="px-6 pt-8 pb-24 space-y-4">
        <Link to="/garden" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> My garden
        </Link>
        <h1 className="text-2xl font-bold">Garden planner</h1>
        <div className="flex gap-1.5 overflow-x-auto">
          {(
            [
              ["map", "Map"],
              ["season", "Seasons"],
              ["companions", "Companions"],
              ["rotation", "Rotation"],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${tab === k ? "bg-leaf text-leaf-foreground" : "bg-secondary"}`}
            >
              {l}
            </button>
          ))}
        </div>

        {plants.length === 0 && <p className="text-sm text-muted-foreground">Add plants to your garden first.</p>}

        {tab === "map" && plants.length > 0 && (
          <section className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Tap a plant, then tap a square to place it. Tap a placed plant to move it.
            </p>
            <div className="grid grid-cols-6 gap-1.5 rounded-3xl bg-card p-3 shadow-soft">
              {Array.from({ length: GRID * GRID }).map((_, i) => {
                const x = i % GRID;
                const y = Math.floor(i / GRID);
                const p = plants.find((q) => q.map_x === x && q.map_y === y);
                return (
                  <button
                    key={i}
                    onClick={() => place(x, y)}
                    className={`aspect-square overflow-hidden rounded-lg text-[9px] leading-tight ${
                      p ? "bg-leaf/20" : "bg-secondary"
                    } ${p && picked === p.id ? "ring-2 ring-leaf" : ""}`}
                    title={p ? displayName(p) : "Empty"}
                  >
                    {p ? (p.image_url ? <img src={p.image_url} alt={displayName(p)} className="h-full w-full object-cover" /> : displayName(p).slice(0, 8)) : ""}
                  </button>
                );
              })}
            </div>
            {unplaced.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {unplaced.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPicked(picked === p.id ? null : p.id)}
                    className={`rounded-full px-3 py-1 text-xs ${picked === p.id ? "bg-leaf text-leaf-foreground" : "bg-secondary"}`}
                  >
                    {displayName(p)}
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "season" && plants.length > 0 && (
          <section className="space-y-3">
            <div className="flex gap-1 overflow-x-auto">
              {MONTHS.map((m, i) => (
                <button
                  key={m}
                  onClick={() => setMonth(i + 1)}
                  className={`rounded-full px-2.5 py-1 text-xs ${month === i + 1 ? "bg-foreground text-background" : "bg-secondary"}`}
                >
                  {m}
                </button>
              ))}
            </div>
            {(["In season", "Dormant"] as const).map((label) => {
              const list = plants.filter((p) => inSeason(p, month) === (label === "In season"));
              return (
                <div key={label} className="rounded-3xl bg-card p-4 shadow-soft">
                  <div className="font-semibold">{label} in {MONTHS[month - 1]} ({list.length})</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {list.map((p) => (
                      <Link key={p.id} to="/garden/$plantId" params={{ plantId: p.id }} className="rounded-full bg-secondary px-3 py-1 text-xs">
                        {displayName(p)}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {tab === "companions" && plants.length > 0 && (
          <section className="space-y-3">
            {plants.map((p) => {
              const c = companionsFor(`${p.name} ${p.species ?? ""}`);
              const neighbours = plants.filter((q) => q.id !== p.id && (q.bed || q.location) && (q.bed || q.location) === (p.bed || p.location));
              const clash = c ? neighbours.filter((n) => c.bad.some((b) => n.name.toLowerCase().includes(b.toLowerCase()))) : [];
              return (
                <div key={p.id} className="rounded-3xl bg-card p-4 shadow-soft text-sm">
                  <div className="font-semibold">{displayName(p)}</div>
                  {c ? (
                    <>
                      <div className="text-xs"><span className="text-leaf">Good with:</span> {c.good.join(", ")}</div>
                      <div className="text-xs"><span className="text-destructive">Avoid:</span> {c.bad.join(", ")}</div>
                    </>
                  ) : (
                    <div className="text-xs text-muted-foreground">No tips yet.</div>
                  )}
                  {clash.length > 0 && (
                    <div className="mt-1 text-xs font-medium text-destructive">
                      ⚠ Sharing space with {clash.map(displayName).join(", ")}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}

        {tab === "rotation" && plants.length > 0 && (
          <section className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Don't plant the same crop family in a bed two years running. Set each plant's bed on its detail page.
            </p>
            {beds.map(([bed, list]) => {
              const fams = Array.from(new Set(list.map((p) => familyFor(p.name, p.species))));
              const year = new Date().getFullYear();
              return (
                <div key={bed} className="rounded-3xl bg-card p-4 shadow-soft text-sm">
                  <div className="font-semibold">{bed}</div>
                  <div className="text-xs text-muted-foreground">{list.map(displayName).join(", ")}</div>
                  <table className="mt-2 w-full text-xs">
                    <tbody>
                      <tr><td className="pr-2 text-muted-foreground">{year}</td><td>{fams.join(", ")}</td></tr>
                      <tr><td className="pr-2 text-muted-foreground">{year + 1}</td><td>{fams.map(nextRotation).join(", ")}</td></tr>
                      <tr><td className="pr-2 text-muted-foreground">{year + 2}</td><td>{fams.map((f) => nextRotation(nextRotation(f))).join(", ")}</td></tr>
                    </tbody>
                  </table>
                </div>
              );
            })}
          </section>
        )}
      </div>
    </MobileLayout>
  );
}
