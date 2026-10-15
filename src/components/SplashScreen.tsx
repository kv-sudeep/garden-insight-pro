import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlantSlideshow } from "@/components/PlantSlideshow";
import { supabase } from "@/integrations/supabase/client";
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
      <PlantSlideshow label="Welcome to KrushiMitra AI" splash className="hero-frame splash-enter h-[min(740px,88svh)] min-h-[560px] w-full rounded-[28px] bg-background">
        {(slide, index) => <>
        <div className="relative px-6 pt-9 text-center">
          <Leaf className="neon-icon mx-auto mb-3 h-12 w-12" strokeWidth={1.2}/>
          <h1 className="text-3xl font-bold italic">KrushiMitra <span className="text-accent">AI</span></h1>
          <p className="mt-2 text-sm">A healthier world, one plant at a time.</p>
          <div className="mx-auto my-5 h-px w-10 bg-accent"/>
          <p key={index} className="slide-copy text-xs leading-6 text-muted-foreground">{slide.caption}</p>
        </div>
        <div className="relative mt-auto px-6 pb-16 pt-6">
          <Button onClick={dismiss} className="blue-button h-12 w-full rounded-full text-base">Get Started <ArrowRight className="ml-auto h-5 w-5"/></Button>
          <p className="mt-5 text-center text-xs text-foreground">Your personal plant doctor</p>
        </div>
        </>}
      </PlantSlideshow>
    </div>
  </div>;
}
