import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Sprout,
  ShoppingBag,
  Beaker,
  Leaf,
  Shield,
} from "lucide-react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/device";
import { toast } from "sonner";

export const Route = createFileRoute("/scan/$scanId")({
  component: ScanDetail,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <MobileLayout>
        <div className="px-6 py-12 text-center">
          <p className="text-sm text-danger">{error.message}</p>
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
        <img
          src={scan.image_url}
          alt={scan.plant_name ?? "Scan"}
          className="h-72 w-full object-cover"
        />
        <Link
          to="/scan"
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-foreground shadow-soft backdrop-blur"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 text-white">
          <div className="text-xs uppercase tracking-wider opacity-80">
            {scan.plant_name ?? "Plant"}
          </div>
          <div className="mt-1 text-2xl font-bold">
            {healthy ? "Healthy plant" : (scan.disease_name ?? "Issue detected")}
          </div>
        </div>
      </div>

      <div className="px-6 pt-6">
        <div
          className={`flex items-center gap-3 rounded-2xl p-4 ${
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

        {scan.symptoms && (
          <Section icon={Leaf} title="Symptoms" body={scan.symptoms} />
        )}
        {scan.treatment && (
          <Section icon={Beaker} title="Treatment" body={scan.treatment} />
        )}
        {scan.organic_treatment && (
          <Section icon={Sprout} title="Organic remedy" body={scan.organic_treatment} />
        )}
        {scan.prevention && (
          <Section icon={Shield} title="Prevention" body={scan.prevention} />
        )}

        <div className="mt-6 grid gap-3">
          {shopUrl && (
            <a href={shopUrl} target="_blank" rel="noopener noreferrer">
              <Button className="h-12 w-full rounded-2xl bg-leaf text-leaf-foreground hover:bg-leaf/90">
                <ShoppingBag className="mr-2 h-5 w-5" /> Shop treatment
              </Button>
            </a>
          )}
          <Button
            variant="outline"
            className="h-12 w-full rounded-2xl"
            onClick={addToGarden}
          >
            <Sprout className="mr-2 h-5 w-5" /> Add to my garden
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
}

function Section({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-leaf" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <p className="rounded-2xl bg-card p-4 text-sm leading-relaxed text-card-foreground shadow-soft">
        {body}
      </p>
    </div>
  );
}
