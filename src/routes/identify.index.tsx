import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Camera, Image as ImageIcon, X, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/device";
import { checkPhotoQuality, type PhotoQuality } from "@/lib/photo";

export const Route = createFileRoute("/identify/")({
  head: () => ({
    meta: [
      { title: "Identify a plant — Plant Doctor" },
      {
        name: "description",
        content:
          "Not sure what plant you have? Snap a photo and get the name, family and full care profile.",
      },
      { property: "og:title", content: "Identify a plant — Plant Doctor" },
      {
        property: "og:description",
        content: "Get the name, family, care needs, toxicity and lookalikes of any plant from a photo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Identify,
});

type Slot = {
  key: string;
  label: string;
  file: File | null;
  preview: string | null;
  quality: PhotoQuality | null;
};

const SLOTS: { key: string; label: string; hint: string }[] = [
  { key: "whole", label: "Whole plant", hint: "Step back so the shape is visible" },
  { key: "leaf", label: "Leaf close-up", hint: "Fill the frame with one leaf" },
  { key: "flower", label: "Flower or fruit", hint: "If it has any right now" },
];

function Identify() {
  const navigate = useNavigate();
  const [slots, setSlots] = useState<Slot[]>(
    SLOTS.map((s) => ({ key: s.key, label: s.label, file: null, preview: null, quality: null }))
  );
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  async function pick(key: string, file: File | null) {
    if (!file) return;
    const quality = await checkPhotoQuality(file);
    setSlots((prev) =>
      prev.map((s) =>
        s.key === key
          ? { ...s, file, preview: URL.createObjectURL(file), quality }
          : s
      )
    );
  }

  function clear(key: string) {
    setSlots((prev) =>
      prev.map((s) => (s.key === key ? { ...s, file: null, preview: null, quality: null } : s))
    );
  }

  async function submit() {
    const chosen = slots.filter((s) => s.file);
    if (chosen.length === 0) {
      toast.error("Add at least one photo first.");
      return;
    }
    const bad = chosen.find((s) => s.quality && !s.quality.ok);
    if (bad && !confirm(`${bad.label}: ${bad.quality?.message}. Identify anyway?`)) return;

    const deviceId = getDeviceId();
    try {
      setBusy("Uploading photos…");
      const uploaded: { label: string; url: string }[] = [];
      for (const s of chosen) {
        const ext = (s.file!.name.split(".").pop() || "jpg").toLowerCase();
        const path = `${deviceId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("scans").upload(path, s.file!);
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("scans").getPublicUrl(path);
        uploaded.push({ label: s.label, url: pub.publicUrl });
      }

      setBusy("Identifying…");
      const resp = await fetch("/api/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: uploaded, notes: notes.trim() || undefined }),
      });
      const result = await resp.json();
      if (!resp.ok) throw new Error(result?.error ?? "Could not identify the plant.");

      setBusy("Saving…");
      const { data: row, error } = await supabase
        .from("identifications")
        .insert({
          device_id: deviceId,
          image_url: uploaded[0].url,
          images: uploaded,
          common_name: result.common_name ?? null,
          scientific_name: result.scientific_name ?? null,
          family: result.family ?? null,
          also_known_as: result.also_known_as ?? null,
          confidence: typeof result.confidence === "number" ? result.confidence : null,
          summary: result.summary ?? null,
          water: result.water ?? null,
          sunlight: result.sunlight ?? null,
          soil: result.soil ?? null,
          soil_ph: result.soil_ph ?? null,
          toxicity: result.toxicity ?? null,
          edible_parts: result.edible_parts ?? null,
          native_range: result.native_range ?? null,
          invasive_notes: result.invasive_notes ?? null,
          common_mistakes: result.common_mistakes ?? null,
          companion_plants: result.companion_plants ?? null,
          similar_plants: result.similar_plants ?? null,
          care_calendar: result.care_calendar ?? null,
          raw: result,
        })
        .select("id")
        .single();
      if (error) throw error;

      navigate({ to: "/identify/$idId", params: { idId: row.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <MobileLayout>
      <div className="bg-gradient-leaf px-6 pb-8 pt-10 text-leaf-foreground">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" /> Plant ID
        </div>
        <h1 className="text-3xl font-bold">What plant is this?</h1>
        <p className="mt-2 text-sm opacity-90">
          Add one to three photos and get the name, family and a full care profile.
        </p>
      </div>

      <div className="space-y-3 px-6 pt-6">
        {SLOTS.map((meta, i) => {
          const slot = slots[i];
          return (
            <div key={meta.key} className="rounded-2xl bg-card p-4 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">{meta.label}</div>
                  <div className="text-xs text-muted-foreground">{meta.hint}</div>
                </div>
                {slot.preview && (
                  <button
                    onClick={() => clear(meta.key)}
                    aria-label={`Remove ${meta.label}`}
                    className="rounded-full bg-secondary p-1.5 text-muted-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {slot.preview ? (
                <div className="mt-3">
                  <img
                    src={slot.preview}
                    alt={meta.label}
                    className="h-40 w-full rounded-xl object-cover"
                  />
                  {slot.quality && (
                    <p
                      className={`mt-2 text-xs ${
                        slot.quality.level === "good"
                          ? "text-success"
                          : slot.quality.level === "warn"
                            ? "text-muted-foreground"
                            : "text-danger"
                      }`}
                    >
                      {slot.quality.message}
                      {slot.quality.tip ? ` — ${slot.quality.tip}` : ""}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1 rounded-xl"
                    onClick={() => inputs.current[`${meta.key}-cam`]?.click()}
                  >
                    <Camera className="mr-2 h-4 w-4" /> Camera
                  </Button>
                  <Button
                    variant="secondary"
                    className="flex-1 rounded-xl"
                    onClick={() => inputs.current[`${meta.key}-lib`]?.click()}
                  >
                    <ImageIcon className="mr-2 h-4 w-4" /> Gallery
                  </Button>
                </div>
              )}

              <input
                ref={(el) => {
                  inputs.current[`${meta.key}-cam`] = el;
                }}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => pick(meta.key, e.target.files?.[0] ?? null)}
              />
              <input
                ref={(el) => {
                  inputs.current[`${meta.key}-lib`] = el;
                }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => pick(meta.key, e.target.files?.[0] ?? null)}
              />
            </div>
          );
        })}

        <div className="rounded-2xl bg-card p-4 shadow-soft">
          <div className="mb-2 text-sm font-semibold">Anything you already know?</div>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Where you found it, smell, size, indoor or outdoor…"
            className="min-h-20 rounded-xl"
          />
        </div>

        <Button
          size="lg"
          onClick={submit}
          disabled={!!busy}
          className="w-full rounded-2xl bg-gradient-leaf text-leaf-foreground"
        >
          {busy ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {busy}
            </>
          ) : (
            "Identify this plant"
          )}
        </Button>

        <p className="pb-4 text-center text-xs text-muted-foreground">
          Plant looking sick instead?{" "}
          <Link to="/scan" className="text-leaf">
            Diagnose a disease
          </Link>
        </p>
      </div>
    </MobileLayout>
  );
}
