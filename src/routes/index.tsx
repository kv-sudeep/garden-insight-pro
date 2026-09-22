import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Camera, Sparkles } from "lucide-react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/device";
import heroLeaves from "@/assets/hero-leaves.jpg";
import iconLeaf from "@/assets/icon-leaf.png";
import iconShield from "@/assets/icon-shield.png";
import iconSparkle from "@/assets/icon-sparkle.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Plant Doctor — AI Plant Disease Detection" },
      {
        name: "description",
        content:
          "Snap a photo of any plant and get instant AI diagnosis, treatment plans, and care tips.",
      },
    ],
  }),
  component: Index,
});

type Scan = {
  id: string;
  plant_name: string | null;
  disease_name: string | null;
  is_healthy: boolean | null;
  image_url: string;
  created_at: string;
};

function Index() {
  const [recent, setRecent] = useState<Scan[]>([]);

  useEffect(() => {
    const deviceId = getDeviceId();
    supabase
      .from("scans")
      .select("id, plant_name, disease_name, is_healthy, image_url, created_at")
      .eq("device_id", deviceId)
      .order("created_at", { ascending: false })
      .limit(4)
      .then(({ data }) => setRecent((data as Scan[]) ?? []));
  }, []);

  return (
    <MobileLayout>
      <header className="relative overflow-hidden rounded-b-[2rem] bg-gradient-hero px-6 pb-10 pt-12 text-leaf-foreground shadow-leaf">
        <img
          src={heroLeaves}
          alt=""
          width={1280}
          height={896}
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> AI-powered
          </div>
          <h1 className="text-3xl font-bold leading-tight">Plant Doctor</h1>
          <p className="mt-2 text-sm text-white/80">
            Diagnose any plant disease in seconds with a single photo.
          </p>
          <Link to="/scan" className="mt-6 inline-block">
            <Button size="lg" className="rounded-full bg-white text-leaf hover:bg-white/90">
              <Camera className="mr-2 h-5 w-5" /> Scan a plant
            </Button>
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-3 gap-3 px-6 py-6">
        <FeatureChip icon={iconLeaf} label="100+ plants" />
        <FeatureChip icon={iconShield} label="Treatment plans" />
        <FeatureChip icon={iconSparkle} label="Instant AI" />
      </section>

      <section className="grid grid-cols-2 gap-3 px-6 pb-6">
        <Link
          to="/identify"
          className="rounded-2xl bg-card p-4 shadow-soft transition-transform hover:-translate-y-0.5"
        >
          <div className="text-sm font-semibold">Identify a plant</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Don't know the name? Snap a photo.
          </p>
        </Link>
        <Link
          to="/guides"
          className="rounded-2xl bg-card p-4 shadow-soft transition-transform hover:-translate-y-0.5"
        >
          <div className="text-sm font-semibold">Disease & pest guides</div>
          <p className="mt-1 text-xs text-muted-foreground">Browse problems without a photo.</p>
        </Link>
      </section>

      <section className="px-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent scans</h2>
          {recent.length > 0 && (
            <Link to="/garden" className="text-sm text-leaf">
              View all
            </Link>
          )}
        </div>
        {recent.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No scans yet. Tap “Scan a plant” to get started.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {recent.map((s) => (
              <Link
                key={s.id}
                to="/scan/$scanId"
                params={{ scanId: s.id }}
                className="group overflow-hidden rounded-2xl bg-card shadow-soft transition-transform hover:-translate-y-0.5"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={s.image_url}
                    alt={s.plant_name ?? "Scan"}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="p-3">
                  <div className="truncate text-sm font-semibold">{s.plant_name ?? "Unknown"}</div>
                  <div
                    className={`truncate text-xs ${
                      s.is_healthy ? "text-success" : "text-danger"
                    }`}
                  >
                    {s.is_healthy ? "Healthy" : (s.disease_name ?? "Issue detected")}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </MobileLayout>
  );
}

function FeatureChip({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-gradient-to-b from-secondary to-secondary/40 p-3 text-center shadow-soft transition-transform hover:-translate-y-1 hover:scale-105">
      <img
        src={icon}
        alt=""
        width={48}
        height={48}
        loading="lazy"
        className="h-12 w-12 object-contain drop-shadow-lg"
      />
      <span className="text-xs font-medium text-secondary-foreground">{label}</span>
    </div>
  );
}
