import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import plantHero from "@/assets/plant-blue-hero.jpg";
import gardenSlide from "@/assets/garden-blue-slide.jpg";
import diseaseLeaf from "@/assets/disease-leaf.jpg";

const slides = [
  { image: plantHero, alt: "Healthy monstera in a metallic planter", title: "Your Personal", accent: "Plant Doctor", description: "Expert care for every leaf. A healthier garden starts here.", action: "Scan a Plant", to: "/scan", caption: "Discover. Diagnose. Grow." },
  { image: gardenSlide, alt: "Basil, fern and peace lily in silver planters", title: "Grow Your", accent: "Green World", description: "Keep your plants close and your garden thriving.", action: "My Garden", to: "/garden", caption: "Nurture every plant. Watch your garden grow." },
  { image: diseaseLeaf, alt: "Detailed leaf showing powdery mildew", title: "Care for", accent: "Every Leaf", description: "Explore plant diseases and find the right treatment.", action: "Explore Diseases", to: "/guides", caption: "Know the symptoms. Find the right care." },
] as const;

export function PlantSlideshow({ children, className, label, splash = false }: {
  children: (slide: typeof slides[number], index: number) => ReactNode;
  className?: string;
  label: string;
  splash?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [interacting, setInteracting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStart = useRef<number | null>(null);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(preference.matches);
    sync();
    preference.addEventListener("change", sync);
    return () => preference.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    if (interacting || reducedMotion) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex(current => (current + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [interacting, reducedMotion]);

  return <div className={cn("plant-slideshow relative isolate overflow-hidden", className)} role="region" aria-roledescription="carousel" aria-label={label}
    onMouseEnter={() => setInteracting(true)} onMouseLeave={() => setInteracting(false)}
    onFocusCapture={() => setInteracting(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false); }}
    onTouchStart={event => { touchStart.current = event.touches[0]?.clientX ?? null; }}
    onTouchEnd={event => {
      const end = event.changedTouches[0]?.clientX;
      if (touchStart.current !== null && end !== undefined && Math.abs(end - touchStart.current) > 45) {
        setIndex(current => (current + (end < (touchStart.current ?? end) ? 1 : slides.length - 1)) % slides.length);
      }
      touchStart.current = null;
    }}>
    {slides.map((slide, position) => <img key={slide.image} src={slide.image} alt={position === index ? slide.alt : ""} aria-hidden={position !== index} width={1280} height={1024}
      className={cn("slideshow-image absolute inset-0 h-full w-full object-cover", splash && "slideshow-image-splash", position === index && "is-current")}/>) }
    <div className={cn("slideshow-shade absolute inset-0", splash && "slideshow-shade-splash")} />
    <div className="slideshow-content relative z-10 flex h-full flex-col">{children(slides[index], index)}</div>
    <div className="slideshow-controls absolute inset-x-0 bottom-2 z-20 flex items-center justify-center gap-1">
      {slides.map((slide, position) => <Button key={slide.title} variant="ghost" size="icon" className="slideshow-dot h-8 w-8 rounded-full hover:bg-secondary/50" aria-label={`Show slide ${position + 1}: ${slide.accent}`} aria-pressed={position === index} onClick={() => setIndex(position)}>
        <span className={cn("h-1.5 rounded-full transition-all duration-300", position === index ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground")} />
      </Button>)}
    </div>
  </div>;
}