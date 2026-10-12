import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { MobileLayout } from "@/components/MobileLayout";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/library/")({
  head: () => ({
    meta: [
      { title: "Plant Care Library — KrushiMitra AI" },
      { name: "description", content: "Care guides and disease info for popular plants." },
      { property: "og:title", content: "Plant Care Library — KrushiMitra AI" },
      { property: "og:description", content: "Care guides and disease info for popular plants." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Library,
});

type Plant = {
  id: string;
  name: string;
  scientific_name: string | null;
  category: string | null;
};

function Library() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    supabase
      .from("plant_library")
      .select("id, name, scientific_name, category")
      .order("name")
      .then(({ data }) => setPlants((data as Plant[]) ?? []));
  }, []);

  const [activeCat, setActiveCat] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of plants) set.add(p.category ?? "Other");
    return Array.from(set).sort();
  }, [plants]);

  const filtered = useMemo(
    () =>
      plants.filter((p) => {
        const matchesQ = (p.name + " " + (p.scientific_name ?? ""))
          .toLowerCase()
          .includes(q.toLowerCase());
        const matchesCat = !activeCat || (p.category ?? "Other") === activeCat;
        return matchesQ && matchesCat;
      }),
    [plants, q, activeCat]
  );

  const grouped = useMemo(() => {
    const g: Record<string, Plant[]> = {};
    for (const p of filtered) {
      const k = p.category ?? "Other";
      (g[k] ??= []).push(p);
    }
    return g;
  }, [filtered]);

  return (
    <MobileLayout>
      <div className="px-6 pt-10">
        <h1 className="text-2xl font-bold">Plant library</h1>
        <p className="mt-1 text-sm text-muted-foreground">Care guides and common diseases.</p>

        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search plants…"
            className="h-12 rounded-2xl border-border bg-card pl-10"
          />
        </div>

        {categories.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCat(null)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                activeCat === null
                  ? "bg-leaf text-leaf-foreground"
                  : "bg-card text-muted-foreground hover:bg-secondary"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeCat === cat
                    ? "bg-leaf text-leaf-foreground"
                    : "bg-card text-muted-foreground hover:bg-secondary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 space-y-6">
          {Object.entries(grouped).map(([cat, list]) => (
            <div key={cat}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {cat}
              </h2>
              <div className="space-y-2">
                {list.map((p) => (
                  <Link
                    key={p.id}
                    to="/library/$plantId"
                    params={{ plantId: p.id }}
                    className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-soft transition-transform hover:-translate-y-0.5"
                  >
                    <div>
                      <div className="font-semibold">{p.name}</div>
                      {p.scientific_name && (
                        <div className="text-xs italic text-muted-foreground">
                          {p.scientific_name}
                        </div>
                      )}
                    </div>
                    <span className="text-leaf">›</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
}
