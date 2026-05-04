import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sprout, Trash2 } from "lucide-react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/device";

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
  created_at: string;
};

function Garden() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase
      .from("garden_plants")
      .select("id, name, species, image_url, notes, created_at")
      .eq("device_id", getDeviceId())
      .order("created_at", { ascending: false });
    setPlants((data as Plant[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    await supabase.from("garden_plants").delete().eq("id", id);
    setPlants((p) => p.filter((x) => x.id !== id));
  }

  return (
    <MobileLayout>
      <div className="px-6 pt-10">
        <h1 className="text-2xl font-bold">My garden</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {plants.length} plant{plants.length === 1 ? "" : "s"}
        </p>

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
        ) : (
          <div className="mt-6 space-y-3">
            {plants.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft"
              >
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
                  <div className="truncate font-semibold">{p.name}</div>
                  {p.species && (
                    <div className="truncate text-xs text-muted-foreground">{p.species}</div>
                  )}
                  {p.notes && (
                    <div className="truncate text-xs text-warning">⚠ {p.notes}</div>
                  )}
                </div>
                <button
                  onClick={() => remove(p.id)}
                  className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-danger"
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
