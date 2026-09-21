import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { MobileLayout } from "@/components/MobileLayout";
import { supabase } from "@/integrations/supabase/client";
import { GuideSection, StepList } from "@/components/GuideSection";

export const Route = createFileRoute("/guides/pest/$slug")({
  head: () => ({
    meta: [
      { title: "Garden pest guide — Plant Doctor" },
      {
        name: "description",
        content: "How to spot this pest, the damage it does, its life cycle, treatment and prevention.",
      },
      { property: "og:title", content: "Garden pest guide — Plant Doctor" },
      {
        property: "og:description",
        content: "Spotting, damage, life cycle, treatment and prevention for this garden pest.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PestGuide;
});

type Pest = {
  slug: string;
  name: string;
  scientific_name: string | null;
  affects: string | null;
  summary: string | null;
  identify: string | null;
  damage: string | null;
  lifecycle: string | null;
  treatment: string | null;
  organic_treatment: string | null;
  prevention: string | null;
};

function PestGuide() {
  const { slug } = Route.useParams();
  const [item, setItem] = useState<Pest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("pests")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        setItem(data as Pest | null);
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
        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
          pest
        </span>
        <h1 className="mt-2 text-3xl font-bold">{item.name}</h1>
        {item.scientific_name && (
          <p className="text-sm italic opacity-80">{item.scientific_name}</p>
        )}
        {item.summary && <p className="mt-3 text-sm opacity-90">{item.summary}</p>}
      </div>

      <div className="px-6 pt-6">
        <GuideSection title="Affects" body={item.affects} />
        <GuideSection title="How to spot it" body={item.identify} />
        <GuideSection title="Damage it causes" body={item.damage} />
        <GuideSection title="Life cycle" body={item.lifecycle} />
        <StepList title="Treatment" body={item.treatment} />
        <StepList title="Organic / home remedy" body={item.organic_treatment} />
        <StepList title="Prevention" body={item.prevention} />
      </div>
    </MobileLayout>
  );
}
