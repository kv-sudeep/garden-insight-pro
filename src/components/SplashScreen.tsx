import { useEffect, useState } from "react";
import splashLogo from "@/assets/splash-logo.png";

export function SplashScreen({ duration = 2200 }: { duration?: number }) {
  const [phase, setPhase] = useState<"in" | "out" | "gone">("in");

  useEffect(() => {
    if (sessionStorage.getItem("km_splash_seen")) {
      setPhase("gone");
      return;
    }
    const t1 = setTimeout(() => setPhase("out"), duration);
    const t2 = setTimeout(() => {
      setPhase("gone");
      sessionStorage.setItem("km_splash_seen", "1");
    }, duration + 500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [duration]);

  if (phase === "gone") return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-gradient-hero transition-opacity duration-500 ${
        phase === "out" ? "opacity-0" : "opacity-100"
      }`}
      style={{ perspective: "1000px" }}
      aria-hidden
    >
      {/* floating orbs */}
      <div className="absolute left-10 top-20 h-24 w-24 animate-pulse rounded-full bg-white/10 blur-2xl" />
      <div className="absolute bottom-24 right-10 h-32 w-32 animate-pulse rounded-full bg-white/10 blur-2xl" />

      <div className="flex flex-col items-center gap-6">
        <div className="splash-3d">
          <img
            src={splashLogo}
            alt="KrushiMitra AI"
            width={320}
            height={320}
            className="h-72 w-72 object-contain drop-shadow-2xl"
          />
        </div>
        <div className="text-center text-white">
          <p className="text-xs font-medium uppercase tracking-[0.3em] opacity-80">
            AI Plant Doctor
          </p>
          <div className="mt-4 flex justify-center gap-1.5">
            <span className="h-2 w-2 animate-bounce rounded-full bg-white [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-white [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-white" />
          </div>
        </div>
      </div>

      <style>{`
        .splash-3d {
          transform-style: preserve-3d;
          animation: splash-float 3s ease-in-out infinite, splash-pop 0.7s cubic-bezier(.34,1.56,.64,1) both;
        }
        @keyframes splash-float {
          0%, 100% { transform: translateY(0) rotateY(-8deg) rotateX(4deg); }
          50% { transform: translateY(-12px) rotateY(8deg) rotateX(-2deg); }
        }
        @keyframes splash-pop {
          0% { transform: scale(0.6) rotateY(-30deg); opacity: 0; }
          100% { transform: scale(1) rotateY(-8deg); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
