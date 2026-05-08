import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sprout, Trash2, Pencil, Check, X } from "lucide-react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
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
  created_at: string;
};

function Garden() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftNotes, setDraftNotes] = useState("");

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
            {plants.map((p) => {
              const isEditing = editingId === p.id;
              return (
                <div key={p.id} className="rounded-2xl bg-card p-3 shadow-soft">
                  <div className="flex items-start gap-3">
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
                            rows={2}
                            className="text-sm"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="truncate font-semibold">{p.name}</div>
                          {p.species && (
                            <div className="truncate text-xs text-muted-foreground">{p.species}</div>
                          )}
                          {p.notes && (
                            <div className="mt-1 text-xs text-muted-foreground">{p.notes}</div>
                          )}
                        </>
                      )}
                    </div>
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
