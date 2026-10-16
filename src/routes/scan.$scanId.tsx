import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";
import { MobileLayout } from "@/components/MobileLayout";
import { Photo3DPreview } from "@/components/Photo3DPreview";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/device";
import { toast } from "sonner";
import iconBeaker from "@/assets/icon-beaker.png";
import iconDroplet from "@/assets/icon-droplet.png";
import iconChart from "@/assets/icon-chart.png";
import iconBag from "@/assets/icon-bag.png";
import iconLeaf from "@/assets/icon-leaf.png";
import iconShield from "@/assets/icon-shield.png";
import iconGarden from "@/assets/icon-garden.png";
import iconSymptoms from "@/assets/icon-symptoms.png";

export const Route = createFileRoute("/scan/$scanId")({
  head: () => ({ meta: [
    { title: "Plant Diagnosis Results — KrushiMitra AI" },
    { name: "description", content: "Review your plant diagnosis, treatment steps and next care actions." },
    { property: "og:title", content: "Plant Diagnosis Results — KrushiMitra AI" },
    { property: "og:description", content: "Review your plant diagnosis, treatment steps and next care actions." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ScanDetail,
  errorComponent: ({ error, reset }: { error: unknown; reset: () => void }) => {
    const router = useRouter();
    return (
      <MobileLayout>
        <div className="px-6 py-12 text-center">
          <p className="text-sm text-danger">{error instanceof Error ? error.message : "Something went wrong."}</p>
          <Button
            className="mt-4"
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Try again
          </Button>
        </div>
      </MobileLayout>
    );
  },
  notFoundComponent: () => (
    <MobileLayout>
      <div className="px-6 py-12 text-center text-muted-foreground">Scan not found.</div>
    </MobileLayout>
  ),
});

type Scan = {
  id: string;
  image_url: string;
  plant_name: string | null;
  disease_name: string | null;
  is_healthy: boolean | null;
  severity: string | null;
  confidence: number | null;
  symptoms: string | null;
  treatment: string | null;
  organic_treatment: string | null;
  prevention: string | null;
  shop_query: string | null;
  created_at: string;
};

function splitSteps(text: string | null | undefined): string[] {
  if (!text) return [];
  // Split on numbered lists, bullets, or sentences
  const parts = text
    .split(/(?:\n+|(?:^|\s)\d+[.)]\s+|\s*[-•]\s+|(?<=[.!?])\s+(?=[A-Z]))/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);
  return parts.slice(0, 6);
}

function ScanDetail() {
  const { scanId } = Route.useParams();
  const [scan, setScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("scans")
      .select("*")
      .eq("id", scanId)
      .maybeSingle()
      .then(({ data }) => {
        setScan(data as Scan | null);
        setLoading(false);
      });
  }, [scanId]);

  const treatmentSteps = useMemo(() => splitSteps(scan?.treatment), [scan?.treatment]);
  const organicSteps = useMemo(() => splitSteps(scan?.organic_treatment), [scan?.organic_treatment]);
  const preventionSteps = useMemo(() => splitSteps(scan?.prevention), [scan?.prevention]);

  const nextActions = useMemo(() => {
    if (!scan) return [] as { icon: string; title: string; detail: string }[];
    if (scan.is_healthy) {
      return [
        { icon: iconDroplet, title: "Keep watering", detail: "Maintain your current schedule." },
        { icon: iconChart, title: "Track weekly", detail: "Re-scan in 7 days to monitor health." },
        { icon: iconShield, title: "Prevent issues", detail: "Inspect leaves for early signs." },
      ];
    }
    const sev = scan.severity ?? "mild";
    const urgency = sev === "severe" ? "today" : sev === "moderate" ? "within 2 days" : "this week";
    return [
      {
        icon: iconBeaker,
        title: `Start treatment ${urgency}`,
        detail: treatmentSteps[0] ?? "Apply recommended treatment.",
      },
      {
        icon: iconDroplet,
        title: "Adjust watering",
        detail: "Avoid wet leaves; water at the base only.",
      },
      {
        icon: iconChart,
        title: "Re-scan in 5 days",
        detail: "Track recovery and update treatment if needed.",
      },
    ];
  }, [scan, treatmentSteps]);

  async function addToGarden() {
    if (!scan) return;
    const { error } = await supabase.from("garden_plants").insert({
      device_id: getDeviceId(),
      name: scan.plant_name ?? "My plant",
      species: scan.plant_name,
      image_url: scan.image_url,
      notes: scan.disease_name ?? null,
      last_scan_id: scan.id,
    });
    if (error) toast.error(error.message);
    else toast.success("Added to your garden");
  }

  if (loading) {
    return (
      <MobileLayout>
        <div className="px-6 py-12 text-center text-muted-foreground">Loading…</div>
      </MobileLayout>
    );
  }
  if (!scan) {
    return (
      <MobileLayout>
        <div className="px-6 py-12 text-center text-muted-foreground">Scan not found.</div>
      </MobileLayout>
    );
  }

  const healthy = !!scan.is_healthy;
  const severityColor =
    scan.severity === "severe"
      ? "text-danger"
      : scan.severity === "moderate"
        ? "text-warning"
        : "text-success";

  const shopUrl = scan.shop_query
    ? `https://www.amazon.com/s?k=${encodeURIComponent(scan.shop_query)}`
    : null;

  return (
    <MobileLayout>
      <div className="relative">
        <Photo3DPreview src={scan.image_url} alt={scan.plant_name ?? "Plant"} />
        <Link
          to="/scan"
          className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-foreground shadow-soft backdrop-blur"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </div>

      <div className="px-6 pt-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          {scan.plant_name ?? "Plant"}
        </div>
        <h1 className="mt-1 text-2xl font-bold">
          {healthy ? "Healthy plant" : (scan.disease_name ?? "Issue detected")}
        </h1>

        <div
          className={`mt-4 flex items-center gap-3 rounded-2xl p-4 ${
            healthy ? "bg-success/10" : "bg-danger/10"
          }`}
        >
          {healthy ? (
            <CheckCircle2 className="h-8 w-8 text-success" />
          ) : (
            <AlertTriangle className="h-8 w-8 text-danger" />
          )}
          <div className="flex-1">
            <div className="text-sm font-semibold">
              {healthy ? "All good!" : `Severity: `}
              {!healthy && (
                <span className={`capitalize ${severityColor}`}>{scan.severity ?? "unknown"}</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              Confidence: {Math.round((scan.confidence ?? 0) * 100)}%
            </div>
          </div>
        </div>

        {/* Next actions */}
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold">Next actions</h3>
          <div className="grid gap-2">
            {nextActions.map((a) => (
              <div
                key={a.title}
                className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft"
              >
                <img
                  src={a.icon}
                  alt=""
                  loading="lazy"
                  className="h-12 w-12 shrink-0 object-contain drop-shadow-md"
                />
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{a.title}</div>
                  <div className="truncate text-xs text-muted-foreground">{a.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {scan.symptoms && (
          <Section icon={iconSymptoms} title="Symptoms" body={scan.symptoms} />
        )}

        {treatmentSteps.length > 0 && (
          <StepSection icon={iconBeaker} title="Treatment steps" steps={treatmentSteps} />
        )}
        {organicSteps.length > 0 && (
          <StepSection icon={iconLeaf} title="Organic remedy" steps={organicSteps} />
        )}
        {preventionSteps.length > 0 && (
          <StepSection icon={iconShield} title="Prevention" steps={preventionSteps} />
        )}

        <div className="mt-6 grid gap-3 pb-6">
          {shopUrl && (
            <a href={shopUrl} target="_blank" rel="noopener noreferrer">
              <Button className="h-14 w-full rounded-2xl bg-leaf text-leaf-foreground hover:bg-leaf/90">
                <img src={iconBag} alt="" className="mr-2 h-7 w-7 object-contain drop-shadow" />
                Shop treatment
              </Button>
            </a>
          )}
          <Button
            variant="outline"
            className="h-14 w-full rounded-2xl"
            onClick={addToGarden}
          >
            <img src={iconGarden} alt="" className="mr-2 h-7 w-7 object-contain drop-shadow" />
            Add to my garden
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
}

function Section({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center gap-2">
        <img src={icon} alt="" loading="lazy" className="h-7 w-7 object-contain drop-shadow" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <p className="rounded-2xl bg-card p-4 text-sm leading-relaxed text-card-foreground shadow-soft">
        {body}
      </p>
    </div>
  );
}

function StepSection({ icon, title, steps }: { icon: string; title: string; steps: string[] }) {
  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center gap-2">
        <img src={icon} alt="" loading="lazy" className="h-7 w-7 object-contain drop-shadow" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <ol className="space-y-2 rounded-2xl bg-card p-4 shadow-soft">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3 text-sm leading-relaxed text-card-foreground">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-leaf/15 text-xs font-bold text-leaf">
              {i + 1}
            </span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
