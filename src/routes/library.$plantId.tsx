import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Droplets, Sun, Mountain, Bug } from "lucide-react";
import { MobileLayout } from "@/components/MobileLayout";
import { supabase } from "@/integrations/supabase/client";
import { GuideSection, StepList } from "@/components/GuideSection";

export const Route = createFileRoute("/library/$plantId")({
  head: () => ({ meta: [
    { title: "Plant Care & Safety — KrushiMitra AI" },
    { name: "description", content: "Explore watering, soil, toxicity and companion planting information." },
    { property: "og:title", content: "Plant Care & Safety — KrushiMitra AI" },
    { property: "og:description", content: "Explore watering, soil, toxicity and companion planting information." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: PlantDetail,
  notFoundComponent: () => (
    <MobileLayout>
      <div className="px-6 py-12 text-center text-muted-foreground">Plant not found.</div>
    </MobileLayout>
  ),
});

type Plant = {
  id: string;
  name: string;
  scientific_name: string | null;
  category: string | null;
  description: string | null;
  water: string | null;
  sunlight: string | null;
  soil: string | null;
  common_diseases: string | null;
  soil_ph: string | null;
  toxicity: string | null;
  edible_parts: string | null;
  common_mistakes: string | null;
  companion_plants: string | null;
  avoid_near: string | null;
  native_range: string | null;
  invasive_notes: string | null;
  similar_plants: string | null;
  pronunciation: string | null;
};

function PlantDetail() {
  const { plantId } = Route.useParams();
  const [plant, setPlant] = useState<Plant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("plant_library")
      .select("*")
      .eq("id", plantId)
      .maybeSingle()
      .then(({ data }) => {
        setPlant(data as Plant | null);
        setLoading(false);
      });
  }, [plantId]);

  function speak() {
    if (!plant) return;
    const text = plant.pronunciation || plant.scientific_name || plant.name;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  if (loading) {
    return (
      <MobileLayout>
        <div className="px-6 py-12 text-center text-muted-foreground">Loading…</div>
      </MobileLayout>
    );
  }
  if (!plant) {
    return (
      <MobileLayout>
        <div className="px-6 py-12 text-center text-muted-foreground">Plant not found.</div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="bg-gradient-leaf px-6 pb-8 pt-10 text-leaf-foreground">
        <Link
          to="/library"
          className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-3xl font-bold">{plant.name}</h1>
        {plant.scientific_name && (
          <p className="text-sm italic opacity-80">{plant.scientific_name}</p>
        )}
        {(plant.pronunciation || plant.scientific_name) && (
          <button
            onClick={speak}
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur"
          >
            🔊 Say it{plant.pronunciation ? ` · ${plant.pronunciation}` : ""}
          </button>
        )}
        {plant.description && <p className="mt-3 text-sm opacity-90">{plant.description}</p>}
      </div>

      <div className="px-6 pt-6">
        <CareCard icon={Droplets} title="Water" body={plant.water} />
        <CareCard icon={Sun} title="Sunlight" body={plant.sunlight} />
        <CareCard icon={Mountain} title="Soil" body={plant.soil} />
        <GuideSection title="Soil pH" body={plant.soil_ph} />
        <GuideSection title="Toxicity (pets & kids)" body={plant.toxicity} />
        <GuideSection title="Edible parts" body={plant.edible_parts} />
        <StepList title="Common mistakes" body={plant.common_mistakes} />
        <GuideSection title="Good companions" body={plant.companion_plants} />
        <GuideSection title="Keep away from" body={plant.avoid_near} />
        <GuideSection title="Native range" body={plant.native_range} />
        <GuideSection title="Native or invasive" body={plant.invasive_notes} />
        <GuideSection title="Similar plants" body={plant.similar_plants} />
        <CareCard icon={Bug} title="Common diseases" body={plant.common_diseases} />

        <Link
          to="/guides"
          className="mb-6 mt-1 block rounded-2xl bg-card p-4 text-center text-sm font-semibold text-leaf shadow-soft"
        >
          Browse disease & pest guides →
        </Link>
      </div>
    </MobileLayout>
  );
}

function CareCard({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string | null;
}) {
  if (!body) return null;
  return (
    <div className="mb-3 rounded-2xl bg-card p-4 shadow-soft">
      <div className="mb-1 flex items-center gap-2">
        <Icon className="h-4 w-4 text-leaf" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
