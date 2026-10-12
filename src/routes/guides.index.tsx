import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, ArrowLeft, ChevronRight, SlidersHorizontal, ShieldCheck, Bug, Leaf } from "lucide-react";
import { MobileLayout } from "@/components/MobileLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import diseaseLeaf from "@/assets/disease-leaf.jpg";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/guides/")({
  head: () => ({
    meta: [
      { title: "Disease & Pest Guides — Plant Doctor" },
      {
        name: "description",
        content:
          "Browse plant diseases, disorders, nutrient shortages and garden pests with symptoms, treatment and prevention.",
      },
      { property: "og:title", content: "Disease & Pest Guides — Plant Doctor" },
      {
        property: "og:description",
        content: "Symptoms, treatment and prevention for common plant diseases and pests.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Guides,
});

type Disease = {
  slug: string;
  name: string;
  kind: string;
  affects: string | null;
  summary: string | null;
  severity: string | null;
};
type Pest = {
  slug: string;
  name: string;
  scientific_name: string | null;
  affects: string | null;
  summary: string | null;
};

const KINDS = [
  { key: "disease", label: "Diseases" },
  { key: "disorder", label: "Disorders" },
  { key: "deficiency", label: "Nutrients" },
  { key: "pest", label: "Pests" },
] as const;

function Guides() {
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [pests, setPests] = useState<Pest[]>([]);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<string | null>(null);
  const [sort, setSort] = useState("name");

  useEffect(() => {
    supabase
      .from("diseases")
      .select("slug, name, kind, affects, summary, severity")
      .order("name")
      .then(({ data }) => setDiseases((data as Disease[]) ?? []));
    supabase
      .from("pests")
      .select("slug, name, scientific_name, affects, summary")
      .order("name")
      .then(({ data }) => setPests((data as Pest[]) ?? []));
  }, []);

  const rows = useMemo(() => {
    const all = [
      ...diseases.map((d) => ({
        slug: d.slug,
        name: d.name,
        kind: d.kind,
        sub: d.affects,
        summary: d.summary,
        badge: d.severity,
        type: "disease" as const,
      })),
      ...pests.map((p) => ({
        slug: p.slug,
        name: p.name,
        kind: "pest",
        sub: p.affects,
        summary: p.summary,
        badge: null as string | null,
        type: "pest" as const,
      })),
    ];
    const needle = q.trim().toLowerCase();
    return all
      .filter((r) => !kind || r.kind === kind)
      .filter(
        (r) =>
          !needle ||
          `${r.name} ${r.sub ?? ""} ${r.summary ?? ""}`.toLowerCase().includes(needle)
      )
      .sort((a, b) => sort === "severity" ? (a.badge ?? "").localeCompare(b.badge ?? "") || a.name.localeCompare(b.name) : a.name.localeCompare(b.name));
  }, [diseases, pests, q, kind, sort]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { pest: pests.length };
    for (const d of diseases) c[d.kind] = (c[d.kind] ?? 0) + 1;
    return c;
  }, [diseases, pests]);

  return (
    <MobileLayout>
      <div className="px-5 pt-7">
        <div className="flex items-center justify-between">
          <Link to="/" aria-label="Back to home" className="glass-panel flex h-9 w-9 items-center justify-center rounded-full"><ArrowLeft className="h-4 w-4"/></Link>
          <h1 className="text-lg font-semibold">Find Plant Diseases</h1>
          <SlidersHorizontal className="h-5 w-5 text-accent" aria-hidden="true"/>
        </div>

        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search symptoms, names, plants…"
            className="glass-panel h-11 rounded-full pl-10 text-xs"
          />
        </div>

        <div className="mt-4 flex gap-1 overflow-x-auto pb-2">
          <Chip active={kind === null} onClick={() => setKind(null)} label="All" count={diseases.length + pests.length} />
          {KINDS.map((k) => (
            <Chip
              key={k.key}
              active={kind === k.key}
              onClick={() => setKind(k.key)}
              label={k.label}
              count={counts[k.key] ?? 0}
            />
          ))}
        </div>

        <div className="my-4 flex items-center justify-between gap-2 text-[11px] text-muted-foreground"><span>{rows.length} Guides Found</span><label className="flex items-center gap-1">Sort by: <select aria-label="Sort guides" value={sort} onChange={e => setSort(e.target.value)} className="bg-background text-foreground"><option value="name">Name</option><option value="severity">Severity</option></select></label></div>
        <div className="space-y-3">
          {rows.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">Nothing matches that.</p>
          )}
          {rows.map((r) => (
            <Link
              key={`${r.type}-${r.slug}`}
              to={r.type === "pest" ? "/guides/pest/$slug" : "/guides/disease/$slug"}
              params={{ slug: r.slug }}
              className="glass-panel flex min-h-28 overflow-hidden rounded-lg transition-transform hover:-translate-y-0.5"
            >
              <div className="flex w-28 shrink-0 items-center justify-center bg-background/50">
                {r.slug === "powdery-mildew" ? <img src={diseaseLeaf} alt="Illustrative powdery mildew leaf" width={1024} height={768} className="h-full w-full object-cover"/> : r.type === "pest" ? <Bug className="neon-icon h-12 w-12" strokeWidth={1.1}/> : r.kind === "deficiency" ? <Leaf className="neon-icon h-12 w-12" strokeWidth={1.1}/> : <ShieldCheck className="neon-icon h-12 w-12" strokeWidth={1.1}/>}
              </div>
              <div className="min-w-0 flex-1 p-3">
                <div className="flex items-center justify-between gap-2"><h2 className="text-sm font-semibold">{r.name}</h2><ChevronRight className="h-4 w-4 shrink-0 text-accent"/></div>
                <p className="mt-1 line-clamp-1 text-[10px] text-muted-foreground">{r.sub || r.kind}</p>
                <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-muted-foreground">{r.summary}</p>
                {r.badge && <p className="mt-2 text-[10px] capitalize text-accent">{r.badge} severity</p>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
}

function Chip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <Button
      variant="ghost"
      aria-pressed={active}
      onClick={onClick}
      className={`h-9 shrink-0 gap-1 rounded-lg px-2 text-[10px] font-medium transition-colors ${
        active ? "blue-button" : "text-muted-foreground hover:bg-secondary"
      }`}
    >
      {label}
      <span
        className={`rounded-full px-1.5 text-[10px] ${
          active ? "bg-primary-foreground/20" : "bg-secondary text-muted-foreground"
        }`}
      >
        {count}
      </span>
    </Button>
  );
}
