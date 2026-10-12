import { useEffect, useState } from "react";
import { ArrowRight, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import plantHero from "@/assets/plant-blue-hero.jpg";
export function SplashScreen({ duration = 2200 }: { duration?: number }) {
  const [phase, setPhase] = useState<"in" | "out" | "gone">("in");
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    if (sessionStorage.getItem("km_splash_seen")) setPhase("gone");
    setChecked(true);
  }, []);
  const dismiss = () => { setPhase("out"); sessionStorage.setItem("km_splash_seen", "1"); };
  useEffect(() => { if (phase !== "out") return; const timer = setTimeout(() => setPhase("gone"), Math.min(duration, 500)); return () => clearTimeout(timer); }, [phase, duration]);
  if (!checked || phase === "gone") return null;
  return <div className={`fixed inset-0 z-[100] overflow-y-auto bg-background transition-opacity duration-500 ${phase === "out" ? "pointer-events-none opacity-0" : "opacity-100"}`}>
    <div className="mx-auto flex min-h-[100svh] max-w-md items-center px-5 py-7">
      <div className="hero-frame splash-enter relative flex min-h-[min(740px,88svh)] w-full flex-col overflow-hidden rounded-[28px] bg-background px-6 pb-8 pt-9">
        <img src={plantHero} alt="Monstera in a metallic planter" width={1280} height={1024} className="absolute inset-0 h-full w-full object-cover object-[68%_center] opacity-75"/>
        <div className="relative text-center">
          <Leaf className="neon-icon mx-auto mb-3 h-12 w-12" strokeWidth={1.2}/>
          <h1 className="text-3xl font-bold italic">KrushiMitra <span className="text-accent">AI</span></h1>
          <p className="mt-2 text-sm">A healthier world, one plant at a time.</p>
          <div className="mx-auto my-5 h-px w-10 bg-accent"/>
          <p className="text-xs leading-6 text-muted-foreground">Discover. Diagnose. Grow.</p>
        </div>
        <div className="relative mt-auto pt-64">
          <Button onClick={dismiss} className="blue-button h-12 w-full rounded-full text-base">Get Started <ArrowRight className="ml-auto h-5 w-5"/></Button>
          <p className="mt-5 text-center text-xs text-foreground">Your personal plant doctor</p>
          <div className="mt-6 flex justify-center gap-2"><span className="h-1.5 w-5 rounded-full bg-primary"/><span className="h-1.5 w-1.5 rounded-full bg-muted-foreground"/><span className="h-1.5 w-1.5 rounded-full bg-muted-foreground"/></div>
        </div>
      </div>
    </div>
  </div>;
}
