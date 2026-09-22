import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Leaf } from "lucide-react";
import { toast } from "sonner";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { GuideSection, StepList } from "@/components/GuideSection";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/device";

export const Route = createFileRoute("/identify/$idId")({
  head: () => ({
    meta: [
      { title: "Plant identified — Plant Doctor" },
      {
        name: "description",
        content:
          "Your plant identification with family, care needs, soil pH, toxicity, edible parts and lookalikes.",
      },
      { property: "og:title", content: "Plant identified — Plant Doctor" },
      {
        property: "og:description",
        content: "Name, family, care profile, toxicity and lookalikes for your identified plant.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: IdentifyResult,
});

type Identification = {
  id: string;
  image_url: string;
  images: { label?: string; url: string }[] | null;
  common_name: string | null;
  scientific_name: string | null;
  family: string | null;
  also_known_as: string | null;
  confidence: number | null;
  summary: string | null;
  water: string | null;
  sunlight: string | null;
  soil: string | null;
  soil_ph: string | null;
  toxicity: string | null;
  edible_parts: string | null;
  native_range: string | null;
  invasive_notes: string | null;
  common_mistakes: string | null;
  companion_plants: string | null;
  similar_plants: string | null;
  care_calendar: string | null;
};

function IdentifyResult() {
  const { idId } = Route.useParams();
  const [item, setItem] = useState<Identification | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("identifications")
      .select("*")
      .eq("id", idId)
      .maybeSingle()
      .then(({ data }) => {
        setItem((data as unknown as Identification) ?? null);
        setLoading(false);
      });
  }, [idId]);

  async function addToGarden() {
    if (!item) return;
    setSaving(true);
    const { error } = await supabase.from("garden_plants").insert({
      device_id: getDeviceId(),
      name: item.common_name ?? "Unknown plant",
      species: item.scientific_name,
      image_url: item.image_url,
      notes: item.summary,
    });
    setSaving(false);
    if (error) toast.error("Could not save to your garden.");
    else toast.success("Added to My Garden.");
  }

  if (loading)
    return (
      <MobileLayout>
        <div className="px-6 py-12 text-center text-muted-foreground">Loading…</div>
      </MobileLayout>
    );
  if (!item)
    return (
      <MobileLayout>
        <div className="px-6 py-12 text-center text-muted-foreground">Identification not found.</div>
      </MobileLayout>
    );

  const photos = (item.images?.length ? item.images : [{ url: item.image_url }]) ?? [];
  const confidence = item.confidence != null ? Math.round(item.confidence * (item.confidence <= 1 ? 100 : 1)) : null;

  return (
    <MobileLayout>
      <div className="relative">
        <img
          src={item.image_url}
          alt={item.common_name ?? "Identified plant"}
          className="h-64 w-full object-cover"
        />
        <Link
          to="/identify"
          className="absolute left-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </div>

      <div className="bg-gradient-leaf px-6 pb-6 pt-5 text-leaf-foreground">
        <h1 className="text-3xl font-bold">{item.common_name ?? "Unknown plant"}</h1>
        {item.scientific_name && <p className="text-sm italic opacity-80">{item.scientific_name}</p>}
        <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wider">
          {item.family && <span className="rounded-full bg-white/20 px-2 py-0.5">{item.family}</span>}
          {confidence != null && (
            <span className="rounded-full bg-white/20 px-2 py-0.5">{confidence}% confident</span>
          )}
        </div>
        {item.summary && <p className="mt-3 text-sm opacity-90">{item.summary}</p>}
      </div>

      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-6 pt-4">
          {photos.map((p, i) => (
            <img
              key={i}
              src={p.url}
              alt={p.label ?? `Photo ${i + 1}`}
              className="h-20 w-20 shrink-0 rounded-xl object-cover"
            />
          ))}
        </div>
      )}

      <div className="px-6 pt-6">
        <GuideSection title="Also known as" body={item.also_known_as} />
        <GuideSection title="Water" body={item.water} />
        <GuideSection title="Sunlight" body={item.sunlight} />
        <GuideSection title="Soil" body={item.soil} />
        <GuideSection title="Soil pH" body={item.soil_ph} />
        <GuideSection title="Toxicity (pets & kids)" body={item.toxicity} />
        <GuideSection title="Edible parts" body={item.edible_parts} />
        <GuideSection title="Native range" body={item.native_range} />
        <GuideSection title="Native or invasive" body={item.invasive_notes} />
        <StepList title="Common mistakes" body={item.common_mistakes} />
        <GuideSection title="Good companions" body={item.companion_plants} />
        <GuideSection title="Similar plants" body={item.similar_plants} />
        <StepList title="Care through the year" body={item.care_calendar} />

        <Button
          size="lg"
          onClick={addToGarden}
          disabled={saving}
          className="mb-6 mt-2 w-full rounded-2xl bg-gradient-leaf text-leaf-foreground"
        >
          <Leaf className="mr-2 h-5 w-5" /> Add to my garden
        </Button>
      </div>
    </MobileLayout>
  );
}
