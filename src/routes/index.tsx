import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Camera, Search, Sprout, ShieldCheck, ScanLine, BookOpen, ArrowRight, ChevronRight, Leaf, Bug } from "lucide-react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/device";
import diseaseLeaf from "@/assets/disease-leaf.jpg";
import { PlantSlideshow } from "@/components/PlantSlideshow";
import { InstallApp } from "@/components/InstallApp";
export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "KrushiMitra AI — Your Plant Doctor" },
    { name: "description", content: "Identify plants, diagnose plant diseases and care for your garden with KrushiMitra AI." },
    { property: "og:title", content: "KrushiMitra AI — Your Plant Doctor" },
    { property: "og:description", content: "Identify, diagnose and grow a healthier garden." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: Index,
});
type Scan = { id: string; plant_name: string | null; disease_name: string | null; is_healthy: boolean | null; image_url: string; created_at: string };
const actions = [ { to: "/scan", label: "Scan Plant", icon: Camera }, { to: "/identify", label: "Identify", icon: ScanLine }, { to: "/guides", label: "Diseases", icon: ShieldCheck }, { to: "/garden", label: "My Garden", icon: Sprout }, { to: "/library", label: "Care Guides", icon: BookOpen } ] as const;
function Index() {
  const [recent, setRecent] = useState<Scan[]>([]);
  useEffect(() => { supabase.from("scans").select("id, plant_name, disease_name, is_healthy, image_url, created_at").eq("device_id", getDeviceId()).order("created_at", { ascending: false }).limit(4).then(({ data }) => setRecent((data as Scan[]) ?? [])); }, []);
  return <MobileLayout>
    <header className="home-enter flex items-center justify-between px-5 pb-4 pt-7">
      <Leaf className="neon-icon h-6 w-6"/><h1 className="text-xl font-bold italic">KrushiMitra<span className="text-accent"> AI</span></h1>
      <InstallApp />
    </header>
    <div className="px-5">
      <Link to="/guides" className="glass-panel mb-4 flex h-11 items-center gap-3 rounded-full px-4 text-xs text-muted-foreground"><Search className="h-4 w-4"/>Search plants, diseases, symptoms…</Link>
      <PlantSlideshow label="Plant care highlights" className="hero-frame home-enter h-[280px] rounded-2xl">
        {(slide, index) => <div key={index} className="slide-copy relative max-w-[70%] px-4 pb-12 pt-6">
          <h2 className="text-2xl font-bold leading-tight">{slide.title}<br/><span className="text-accent">{slide.accent}</span></h2>
          <p className="mb-4 mt-3 max-w-36 text-xs leading-5 text-muted-foreground">{slide.description}</p>
          <Button asChild className="blue-button h-9 rounded-lg px-3 text-xs"><Link to={slide.to}>{slide.action} <ArrowRight className="h-3.5 w-3.5"/></Link></Button>
        </div>}
      </PlantSlideshow>
      <div className="home-actions my-4 grid grid-cols-5 gap-2">
        {actions.map(({to,label,icon:Icon}) => <Link key={to} to={to} className="glass-panel flex h-[78px] flex-col items-center justify-center gap-2 rounded-lg text-center text-[9px]"><Icon className="neon-icon h-6 w-6" strokeWidth={1.4}/>{label}</Link>)}
      </div>
      <section className="home-enter home-enter-later mt-6">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">Plant Health Guides</h2><Link to="/guides" className="flex items-center text-[11px] text-accent">View All <ChevronRight className="h-3 w-3"/></Link></div>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/guides/disease/$slug" params={{slug:"powdery-mildew"}} className="glass-panel overflow-hidden rounded-lg"><img src={diseaseLeaf} alt="Illustrative powdery mildew leaf" width={1024} height={768} className="h-24 w-full object-cover"/><div className="p-3"><p className="text-xs font-semibold">Powdery Mildew</p><p className="mt-1 text-[10px] text-muted-foreground">Symptoms & treatment</p></div></Link>
          <Link to="/guides" className="glass-panel flex flex-col justify-center rounded-lg p-4"><Bug className="neon-icon mb-3 h-9 w-9" strokeWidth={1.2}/><p className="text-xs font-semibold">Disease & Pest Library</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">Find the right care for your plants</p></Link>
        </div>
      </section>
      <section className="home-enter home-enter-last mt-6"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">Recent Scans</h2><Link to="/garden" className="text-[11px] text-accent">My Garden ›</Link></div>
        {recent.length === 0 ? <div className="glass-panel flex items-center gap-3 rounded-lg p-4"><ScanLine className="neon-icon h-7 w-7"/><div><p className="text-xs font-medium">No scans yet</p><p className="mt-1 text-[11px] text-muted-foreground">Your plants’ health journey starts here.</p></div></div> : <div className="space-y-2">{recent.map(s => <Link key={s.id} to="/scan/$scanId" params={{scanId:s.id}} className="glass-panel flex gap-3 overflow-hidden rounded-lg"><img src={s.image_url} alt={s.plant_name ?? "Plant"} className="h-20 w-24 object-cover"/><div className="py-3"><p className="text-sm font-semibold">{s.plant_name ?? "Unknown plant"}</p><p className={`mt-1 text-xs ${s.is_healthy ? "text-success" : "text-warning"}`}>{s.is_healthy ? "Healthy" : s.disease_name ?? "Issue detected"}</p></div></Link>)}</div>}
      </section>
    </div>
  </MobileLayout>;
}
