import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Camera, ShieldCheck, Leaf, Activity, ArrowRight } from "lucide-react";
import diseaseLeaf from "@/assets/disease-leaf.jpg";
import { Button } from "@/components/ui/button";
import { MobileLayout } from "@/components/MobileLayout";
import { supabase } from "@/integrations/supabase/client";
import { GuideSection, StepList } from "@/components/GuideSection";

export const Route = createFileRoute("/guides/disease/$slug")({
  head: () => ({
    meta: [
      { title: "Plant disease guide — Plant Doctor" },
      {
        name: "description",
        content: "Symptoms, causes, treatment, organic remedies and prevention for this plant problem.",
      },
      { property: "og:title", content: "Plant disease guide — Plant Doctor" },
      {
        property: "og:description",
        content: "Symptoms, causes, treatment and prevention for this plant problem.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DiseaseGuide,
});

type Disease = {
  slug: string;
  name: string;
  kind: string;
  pathogen: string | null;
  affects: string | null;
  summary: string | null;
  symptoms: string | null;
  causes: string | null;
  treatment: string | null;
  organic_treatment: string | null;
  prevention: string | null;
  severity: string | null;
  image_url: string | null;
};

function DiseaseGuide() {
  const { slug } = Route.useParams();
  const [item, setItem] = useState<Disease | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("diseases")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        setItem(data as Disease | null);
        setLoading(false);
      });
  }, [slug]);

  if (loading)
    return (
      <MobileLayout>
        <div className="px-6 py-12 text-center text-muted-foreground">Loading…</div>
      </MobileLayout>
    );
  if (!item)
    return (
      <MobileLayout>
        <div className="px-6 py-12 text-center text-muted-foreground">Guide not found.</div>
      </MobileLayout>
    );

  return (
    <MobileLayout>
      <div className="px-5 pt-7">
        <div className="mb-5 flex items-center justify-between"><Link to="/guides" aria-label="Back to search" className="glass-panel flex h-9 w-9 items-center justify-center rounded-full"><ArrowLeft className="h-4 w-4"/></Link><span className="text-sm font-medium">Disease Details</span><ShieldCheck className="h-5 w-5 text-accent"/></div>
        <h1 className="text-2xl font-bold">{item.name}</h1>
        {item.pathogen && <p className="mt-1 text-xs italic text-muted-foreground">{item.pathogen}</p>}
        <div className="mt-3 text-[10px] capitalize text-accent">{item.kind} · {item.severity || "Plant health"}</div>
        {item.image_url ? <figure className="my-4"><img src={item.image_url} alt={`${item.name} on a plant`} className="aspect-[4/3] w-full rounded-lg object-cover"/><figcaption className="mt-1 text-[9px] text-muted-foreground">Typical appearance</figcaption></figure> : <div className="my-4 flex h-44 items-center justify-center"><Leaf className="neon-icon h-28 w-28" strokeWidth={0.7}/></div>}
        <div className="mb-5 grid grid-cols-3 gap-2">
          <div className="glass-panel rounded-lg p-3 text-center"><Activity className="mx-auto mb-2 h-4 w-4 text-accent"/><p className="text-[9px] text-muted-foreground">Severity</p><p className="mt-1 text-xs capitalize">{item.severity || "Varies"}</p></div>
          <div className="glass-panel rounded-lg p-3 text-center"><Leaf className="mx-auto mb-2 h-4 w-4 text-accent"/><p className="text-[9px] text-muted-foreground">Category</p><p className="mt-1 text-xs capitalize">{item.kind}</p></div>
          <div className="glass-panel rounded-lg p-3 text-center"><ShieldCheck className="mx-auto mb-2 h-4 w-4 text-accent"/><p className="text-[9px] text-muted-foreground">Care</p><p className="mt-1 text-xs">Treatment</p></div>
        </div>
        <h2 className="mb-2 text-sm font-semibold">About the Disease</h2>
        {item.summary && <p className="mb-5 text-sm leading-6 text-muted-foreground">{item.summary}</p>}
        <GuideSection title="Affects" body={item.affects} />
        <GuideSection title="What you'll see" body={item.symptoms} />
        <GuideSection title="Why it happens" body={item.causes} />
        <StepList title="Treatment" body={item.treatment} />
        <StepList title="Organic / home remedy" body={item.organic_treatment} />
        <StepList title="Prevention" body={item.prevention} />
        <Button asChild className="blue-button mt-4 h-12 w-full rounded-lg"><Link to="/scan"><Camera className="h-4 w-4"/>Check My Plant<ArrowRight className="ml-auto h-4 w-4"/></Link></Button>
      </div>
    </MobileLayout>
  );
}
