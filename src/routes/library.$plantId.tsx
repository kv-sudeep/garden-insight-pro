import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Droplets, Sun, Mountain, Bug } from "lucide-react";
import { MobileLayout } from "@/components/MobileLayout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/library/$plantId")({
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
        {plant.description && <p className="mt-3 text-sm opacity-90">{plant.description}</p>}
      </div>

      <div className="px-6 pt-6">
        <CareCard icon={Droplets} title="Water" body={plant.water} />
        <CareCard icon={Sun} title="Sunlight" body={plant.sunlight} />
        <CareCard icon={Mountain} title="Soil" body={plant.soil} />
        <CareCard icon={Bug} title="Common diseases" body={plant.common_diseases} />
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
