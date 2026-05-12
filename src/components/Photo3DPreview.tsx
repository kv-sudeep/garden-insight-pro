import { useEffect, useRef, useState } from "react";
import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

type Props = { src: string; alt?: string };

export function Photo3DPreview({ src, alt = "" }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [rot, setRot] = useState({ x: 12, y: -18 });
  const [zoom, setZoom] = useState(1);
  const drag = useRef<{ x: number; y: number; rx: number; ry: number } | null>(null);

  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!drag.current) return;
      const dx = e.clientX - drag.current.x;
      const dy = e.clientY - drag.current.y;
      setRot({
        x: Math.max(-60, Math.min(60, drag.current.rx - dy * 0.4)),
        y: Math.max(-60, Math.min(60, drag.current.ry + dx * 0.4)),
      });
    }
    function onUp() {
      drag.current = null;
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  function onDown(e: React.PointerEvent) {
    drag.current = { x: e.clientX, y: e.clientY, rx: rot.x, ry: rot.y };
  }
  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    setZoom((z) => Math.max(0.6, Math.min(2.5, z + (e.deltaY > 0 ? -0.1 : 0.1))));
  }
  function reset() {
    setRot({ x: 12, y: -18 });
    setZoom(1);
  }

  return (
    <div
      ref={wrapRef}
      className="relative h-80 w-full select-none overflow-hidden bg-gradient-to-b from-leaf/20 via-background to-background"
      style={{ perspective: "1200px", touchAction: "none" }}
      onWheel={onWheel}
    >
      {/* blurred photo backdrop */}
      <img
        src={src}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full scale-125 object-cover opacity-40 blur-2xl"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          onPointerDown={onDown}
          className="relative cursor-grab active:cursor-grabbing"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg) scale(${zoom})`,
            transition: drag.current ? "none" : "transform 0.25s ease-out",
          }}
        >
          {/* front face */}
          <div
            className="h-56 w-56 overflow-hidden rounded-3xl shadow-leaf ring-1 ring-white/20"
            style={{ transform: "translateZ(20px)" }}
          >
            <img
              src={src}
              alt={alt}
              draggable={false}
              className="h-full w-full object-cover"
            />
          </div>
          {/* depth slab */}
          <div
            className="absolute inset-0 rounded-3xl bg-gradient-to-b from-leaf/60 to-leaf/30"
            style={{ transform: "translateZ(-10px)" }}
          />
          {/* glossy reflection */}
          <div
            className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-tr from-white/30 via-transparent to-transparent"
            style={{ transform: "translateZ(22px)" }}
          />
        </div>
      </div>

      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/40 px-2 py-1.5 text-white backdrop-blur">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
          className="rounded-full p-1.5 hover:bg-white/10"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-full p-1.5 hover:bg-white/10"
          aria-label="Reset"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(2.5, z + 0.1))}
          className="rounded-full p-1.5 hover:bg-white/10"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
      </div>
      <div className="absolute right-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white backdrop-blur">
        Drag to rotate
      </div>
    </div>
  );
}
