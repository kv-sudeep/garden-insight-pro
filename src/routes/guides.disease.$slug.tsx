import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
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
      <div className="bg-gradient-leaf px-6 pb-8 pt-10 text-leaf-foreground">
        <Link
          to="/guides"
          className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-wider">
          <span className="rounded-full bg-white/20 px-2 py-0.5">{item.kind}</span>
          {item.severity && (
            <span className="rounded-full bg-white/20 px-2 py-0.5">{item.severity}</span>
          )}
        </div>
        <h1 className="mt-2 text-3xl font-bold">{item.name}</h1>
        {item.pathogen && <p className="text-sm italic opacity-80">{item.pathogen}</p>}
        {item.summary && <p className="mt-3 text-sm opacity-90">{item.summary}</p>}
      </div>

      <div className="px-6 pt-6">
        <GuideSection title="Affects" body={item.affects} />
        <GuideSection title="What you'll see" body={item.symptoms} />
        <GuideSection title="Why it happens" body={item.causes} />
        <StepList title="Treatment" body={item.treatment} />
        <StepList title="Organic / home remedy" body={item.organic_treatment} />
        <StepList title="Prevention" body={item.prevention} />
      </div>
    </MobileLayout>
  );
}
