import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { MobileLayout } from "@/components/MobileLayout";
import { Input } from "@/components/ui/input";
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
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [diseases, pests, q, kind]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { pest: pests.length };
    for (const d of diseases) c[d.kind] = (c[d.kind] ?? 0) + 1;
    return c;
  }, [diseases, pests]);

  return (
    <MobileLayout>
      <div className="px-6 pt-10">
        <h1 className="text-2xl font-bold">Problem guides</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Diseases, disorders, nutrient shortages and pests — browse any time, no photo needed.
        </p>

        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search symptoms, names, plants…"
            className="h-12 rounded-2xl border-border bg-card pl-10"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Chip active={kind === null} onClick={() => setKind(null)} label="All" count={rows.length} />
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

        <div className="mt-6 space-y-2">
          {rows.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">Nothing matches that.</p>
          )}
          {rows.map((r) => (
            <Link
              key={`${r.type}-${r.slug}`}
              to={r.type === "pest" ? "/guides/pest/$slug" : "/guides/disease/$slug"}
              params={{ slug: r.slug }}
              className="block rounded-2xl bg-card p-4 shadow-soft transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{r.name}</div>
                  {r.sub && <div className="mt-0.5 text-xs text-muted-foreground">{r.sub}</div>}
                </div>
                {r.badge && (
                  <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                    {r.badge}
                  </span>
                )}
              </div>
              {r.summary && (
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{r.summary}</p>
              )}
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
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        active ? "bg-leaf text-leaf-foreground" : "bg-card text-muted-foreground hover:bg-secondary"
      }`}
    >
      {label}
      <span
        className={`rounded-full px-1.5 text-[10px] ${
          active ? "bg-white/25" : "bg-secondary text-muted-foreground"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
