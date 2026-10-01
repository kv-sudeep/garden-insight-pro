import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { PLANT_COLS, daysAgo, displayName, type GardenPlant } from "@/lib/garden";

export const Route = createFileRoute("/garden/retire/$plantId")({
  head: () => ({
    meta: [
      { title: "Say goodbye — KrushiMitra AI" },
      { name: "description", content: "A gentle way to retire a plant and remember what it taught you." },
      { property: "og:title", content: "Say goodbye — KrushiMitra AI" },
      { property: "og:description", content: "Retire a plant with care and keep its memory." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Retire,
});

const REASONS = ["Overwatered", "Underwatered", "Pests", "Disease", "Too cold / hot", "End of its season", "Not sure"];

function Retire() {
  const { plantId } = Route.useParams();
  const navigate = useNavigate();
  const [plant, setPlant] = useState<GardenPlant | null>(null);
  const [counts, setCounts] = useState({ events: 0, photos: 0, harvests: 0 });
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      const [p, e, ph] = await Promise.all([
        supabase.from("garden_plants").select(PLANT_COLS).eq("id", plantId).maybeSingle(),
        supabase.from("plant_events").select("kind").eq("plant_id", plantId),
        supabase.from("plant_photos").select("id").eq("plant_id", plantId),
      ]);
      setPlant((p.data as GardenPlant) ?? null);
      const ev = e.data ?? [];
      setCounts({ events: ev.length, photos: ph.data?.length ?? 0, harvests: ev.filter((x) => x.kind === "harvest").length });
    })();
  }, [plantId]);

  async function retire() {
    if (!plant) return;
    const text = [reason && `Reason: ${reason}`, note.trim()].filter(Boolean).join(" — ") || null;
    const { error } = await supabase
      .from("garden_plants")
      .update({ retired_at: new Date().toISOString(), retirement_note: text, archived_at: new Date().toISOString() })
      .eq("id", plant.id);
    if (error) return toast.error("Could not save");
    setDone(true);
  }

  if (!plant)
    return (
      <MobileLayout>
        <div className="px-6 pt-10 text-sm text-muted-foreground">Loading…</div>
      </MobileLayout>
    );

  const days = Math.max(1, daysAgo(plant.acquired_on ?? plant.created_at));

  return (
    <MobileLayout>
      <div className="px-6 pt-12 pb-24 text-center space-y-5">
        <div className="text-6xl">🌱</div>
        {done ? (
          <>
            <h1 className="text-2xl font-bold">Thank you, {displayName(plant)}</h1>
            <p className="text-sm text-muted-foreground">
              Every gardener loses plants — it's how we learn. Its history stays safe in your archive.
            </p>
            <Button className="w-full" onClick={() => navigate({ to: "/scan" })}>Start something new</Button>
            <Link to="/garden" className="block text-sm text-leaf">Back to my garden</Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold">Saying goodbye to {displayName(plant)}</h1>
            <p className="text-sm text-muted-foreground">
              You cared for it for {days} day{days === 1 ? "" : "s"}
              {counts.events > 0 && `, logged ${counts.events} care moments`}
              {counts.photos > 0 && `, took ${counts.photos} photos`}
              {counts.harvests > 0 && ` and harvested ${counts.harvests} times`}. That counts.
            </p>
            <div className="text-left">
              <div className="mb-2 text-sm font-semibold">What do you think happened? (optional)</div>
              <div className="flex flex-wrap gap-1.5">
                {REASONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setReason(reason === r ? "" : r)}
                    className={`rounded-full px-3 py-1 text-xs ${reason === r ? "bg-leaf text-leaf-foreground" : "bg-secondary"}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <Textarea
                className="mt-3"
                placeholder="A memory or lesson to keep…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={retire}>Retire with care</Button>
            <Link to="/garden/$plantId" params={{ plantId: plant.id }} className="block text-sm text-muted-foreground">
              Not yet — go back
            </Link>
          </>
        )}
      </div>
    </MobileLayout>
  );
}
