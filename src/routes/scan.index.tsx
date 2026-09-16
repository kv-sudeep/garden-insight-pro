import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  Camera,
  Check,
  HelpCircle,
  Loader2,
  Mic,
  Square,
  Trash2,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/device";
import { checkPhotoQuality, hashFile, type PhotoQuality } from "@/lib/photo";
import { VoiceRecorder } from "@/lib/recorder";
import { toast } from "sonner";

export const Route = createFileRoute("/scan/")({
  head: () => ({
    meta: [
      { title: "Scan a Plant — Plant Doctor" },
      {
        name: "description",
        content:
          "Add top, underside and close-up photos, describe symptoms by voice, and get an instant AI plant diagnosis.",
      },
      { property: "og:title", content: "Scan a Plant — Plant Doctor" },
      {
        property: "og:description",
        content: "Multi-angle photo diagnosis with lighting and focus checks before you submit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScanPage,
});

type AngleKey = "top" | "underside" | "closeup";

const ANGLES: { key: AngleKey; label: string; hint: string }[] = [
  { key: "top", label: "Whole plant", hint: "Step back and capture the full plant from above." },
  { key: "underside", label: "Leaf underside", hint: "Flip a leaf over — pests and mould hide here." },
  { key: "closeup", label: "Close-up", hint: "Fill the frame with the worst affected spot." },
];

type Shot = { file: File; preview: string; quality: PhotoQuality; hash: string };

const PART_OPTIONS = ["Leaves", "Stems", "Roots", "Fruit or flowers", "Whole plant"];
const WHEN_OPTIONS = ["A few days", "1–2 weeks", "Over a month"];
const CHANGE_OPTIONS = [
  "More water than usual",
  "Less water than usual",
  "Repotted recently",
  "Moved to a new spot",
  "New fertiliser",
  "Nothing changed",
];

function ScanPage() {
  const [shots, setShots] = useState<Partial<Record<AngleKey, Shot>>>({});
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [guided, setGuided] = useState(false);
  const [part, setPart] = useState<string | null>(null);
  const [when, setWhen] = useState<string | null>(null);
  const [change, setChange] = useState<string | null>(null);
  const [voiceNote, setVoiceNote] = useState("");
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const recorderRef = useRef<VoiceRecorder | null>(null);
  const pickerRef = useRef<{ key: AngleKey; camera: boolean } | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const taken = ANGLES.filter((a) => shots[a.key]);

  function openPicker(key: AngleKey, camera: boolean) {
    pickerRef.current = { key, camera };
    (camera ? cameraRef : fileRef).current?.click();
  }

  async function onPicked(file: File) {
    const target = pickerRef.current;
    if (!target) return;
    const [quality, hash] = await Promise.all([checkPhotoQuality(file), hashFile(file)]);
    setShots((prev) => {
      const old = prev[target.key];
      if (old) URL.revokeObjectURL(old.preview);
      return { ...prev, [target.key]: { file, preview: URL.createObjectURL(file), quality, hash } };
    });
    if (quality.level === "bad") toast.error(`${quality.message}. ${quality.tip ?? ""}`);
  }

  function removeShot(key: AngleKey) {
    setShots((prev) => {
      const old = prev[key];
      if (old) URL.revokeObjectURL(old.preview);
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function toggleRecording() {
    if (recording) {
      setRecording(false);
      setTranscribing(true);
      try {
        const blob = await recorderRef.current!.stop();
        recorderRef.current = null;
        if (blob.size < 2048) {
          toast.error("That recording was empty — please try again.");
          return;
        }
        const form = new FormData();
        form.append("file", blob, "recording.wav");
        const res = await fetch("/api/transcribe", { method: "POST", body: form });
        const data = (await res.json()) as { text?: string; error?: string };
        if (!res.ok || data.error) throw new Error(data.error ?? "Could not transcribe");
        if (!data.text) {
          toast.error("Nothing was heard — try speaking a little closer.");
          return;
        }
        setVoiceNote((v) => (v ? `${v} ${data.text}` : data.text!));
        toast.success("Added your spoken notes");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not transcribe");
      } finally {
        setTranscribing(false);
      }
      return;
    }

    try {
      const rec = new VoiceRecorder();
      await rec.start();
      recorderRef.current = rec;
      setRecording(true);
    } catch {
      toast.error("Microphone access is needed to record your notes.");
    }
  }

  function buildNotes() {
    const lines: string[] = [];
    if (part) lines.push(`Worst affected part: ${part}`);
    if (when) lines.push(`Symptoms started: ${when}`);
    if (change) lines.push(`Recent change in care: ${change}`);
    if (voiceNote.trim()) lines.push(`Grower's description: ${voiceNote.trim()}`);
    return lines.join("\n");
  }

  async function submit() {
    if (taken.length === 0) {
      toast.error("Add at least one photo first.");
      return;
    }
    const bad = taken.filter((a) => shots[a.key]!.quality.level === "bad");
    if (bad.length > 0) {
      const ok = window.confirm(
        `${bad.length} photo(s) may be too dark or blurry, which lowers accuracy. Submit anyway?`
      );
      if (!ok) return;
    }

    setBusy(true);
    try {
      const deviceId = getDeviceId();
      const primary = shots[taken[0].key]!;

      setProgress("Checking for a repeat scan...");
      const { data: dupe } = await supabase
        .from("scans")
        .select("id")
        .eq("device_id", deviceId)
        .eq("image_hash", primary.hash)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (dupe) {
        setBusy(false);
        setProgress("");
        if (window.confirm("You've already diagnosed this exact photo. Open that result?")) {
          navigate({ to: "/scan/$scanId", params: { scanId: dupe.id } });
          return;
        }
        setBusy(true);
      }

      setProgress(`Uploading ${taken.length} photo${taken.length > 1 ? "s" : ""}...`);
      const uploaded: { label: string; url: string }[] = [];
      for (const angle of taken) {
        const shot = shots[angle.key]!;
        const ext = shot.file.name.split(".").pop() || "jpg";
        const path = `${deviceId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("scans")
          .upload(path, shot.file, { contentType: shot.file.type, upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("scans").getPublicUrl(path);
        uploaded.push({ label: angle.label, url: pub.publicUrl });
      }

      const notes = buildNotes();
      setProgress("Diagnosing with AI...");
      const { data, error } = await supabase.functions.invoke("diagnose-plant", {
        body: { images: uploaded, image_url: uploaded[0].url, notes },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);

      setProgress("Saving results...");
      const { data: scan, error: insErr } = await supabase
        .from("scans")
        .insert({
          device_id: deviceId,
          image_url: uploaded[0].url,
          images: uploaded,
          image_hash: primary.hash,
          user_notes: notes || null,
          plant_name: data.plant_name,
          disease_name: data.disease_name,
          is_healthy: data.is_healthy,
          severity: data.severity,
          confidence: data.confidence,
          symptoms: data.symptoms,
          treatment: data.treatment,
          organic_treatment: data.organic_treatment,
          prevention: data.prevention,
          shop_query: data.shop_query,
          raw: data,
        })
        .select("id")
        .single();
      if (insErr) throw insErr;

      navigate({ to: "/scan/$scanId", params: { scanId: scan.id } });
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to diagnose");
    } finally {
      setBusy(false);
      setProgress("");
    }
  }

  return (
    <MobileLayout>
      <div className="px-6 pt-10">
        <h1 className="text-2xl font-bold">Scan your plant</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          One photo works, but three angles give a far more reliable diagnosis.
        </p>

        {busy && (
          <div className="mt-6 flex flex-col items-center gap-3 rounded-3xl bg-gradient-leaf p-8 text-center text-leaf-foreground shadow-leaf">
            <Loader2 className="h-10 w-10 animate-spin" />
            <p className="text-sm font-medium">{progress}</p>
          </div>
        )}

        <div className="mt-6 grid gap-3">
          {ANGLES.map((angle) => {
            const shot = shots[angle.key];
            return (
              <div key={angle.key} className="rounded-3xl bg-card p-4 shadow-soft">
                <div className="flex items-start gap-3">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-secondary">
                    {shot ? (
                      <img src={shot.preview} alt={angle.label} className="h-full w-full object-cover" />
                    ) : (
                      <Camera className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{angle.label}</div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{angle.hint}</p>

                    {shot && (
                      <div
                        className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                          shot.quality.level === "good"
                            ? "bg-success/10 text-success"
                            : shot.quality.level === "warn"
                              ? "bg-warning/10 text-warning"
                              : "bg-danger/10 text-danger"
                        }`}
                      >
                        {shot.quality.level === "good" ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <TriangleAlert className="h-3.5 w-3.5" />
                        )}
                        {shot.quality.message}
                      </div>
                    )}
                    {shot?.quality.tip && (
                      <p className="mt-1 text-xs text-muted-foreground">{shot.quality.tip}</p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="rounded-xl"
                        disabled={busy}
                        onClick={() => openPicker(angle.key, true)}
                      >
                        <Camera className="mr-1.5 h-4 w-4" />
                        {shot ? "Retake" : "Camera"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        disabled={busy}
                        onClick={() => openPicker(angle.key, false)}
                      >
                        <Upload className="mr-1.5 h-4 w-4" /> Gallery
                      </Button>
                      {shot && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-xl text-danger"
                          disabled={busy}
                          onClick={() => removeShot(angle.key)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Voice symptom note */}
        <div className="mt-6 rounded-3xl bg-card p-4 shadow-soft">
          <div className="text-sm font-semibold">Describe it out loud (optional)</div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Mention smells, spots spreading, drooping — anything a photo can't show.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Button
              size="sm"
              className={`rounded-xl ${recording ? "bg-danger text-white hover:bg-danger/90" : ""}`}
              variant={recording ? "default" : "secondary"}
              disabled={busy || transcribing}
              onClick={toggleRecording}
            >
              {transcribing ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : recording ? (
                <Square className="mr-1.5 h-4 w-4" />
              ) : (
                <Mic className="mr-1.5 h-4 w-4" />
              )}
              {transcribing ? "Transcribing…" : recording ? "Stop recording" : "Record note"}
            </Button>
            {recording && <span className="text-xs text-danger">Listening…</span>}
          </div>
          {voiceNote && (
            <textarea
              className="mt-3 w-full rounded-2xl bg-secondary p-3 text-sm text-secondary-foreground"
              rows={3}
              value={voiceNote}
              onChange={(e) => setVoiceNote(e.target.value)}
            />
          )}
        </div>

        {/* Not sure? guided questions */}
        <div className="mt-4 rounded-3xl bg-card p-4 shadow-soft">
          <button
            className="flex w-full items-center gap-2 text-left"
            onClick={() => setGuided((g) => !g)}
          >
            <HelpCircle className="h-5 w-5 text-leaf" />
            <span className="flex-1 text-sm font-semibold">Not sure what's wrong?</span>
            <span className="text-xs text-muted-foreground">{guided ? "Hide" : "Answer 3 questions"}</span>
          </button>

          {guided && (
            <div className="mt-4 space-y-4">
              <ChipGroup label="Which part looks worst?" options={PART_OPTIONS} value={part} onChange={setPart} />
              <ChipGroup label="When did it start?" options={WHEN_OPTIONS} value={when} onChange={setWhen} />
              <ChipGroup
                label="Anything changed in its care?"
                options={CHANGE_OPTIONS}
                value={change}
                onChange={setChange}
              />
            </div>
          )}
        </div>

        <Button
          size="lg"
          className="mt-6 h-14 w-full rounded-2xl bg-leaf text-leaf-foreground hover:bg-leaf/90"
          disabled={busy || taken.length === 0}
          onClick={submit}
        >
          {busy ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Camera className="mr-2 h-5 w-5" />
          )}
          Diagnose {taken.length > 0 ? `(${taken.length} photo${taken.length > 1 ? "s" : ""})` : ""}
        </Button>

        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void onPicked(f);
          }}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void onPicked(f);
          }}
        />

        <div className="mt-8 rounded-2xl bg-secondary p-4 text-sm text-secondary-foreground">
          <p className="font-semibold">📸 Tips for best results</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Focus on affected leaves up close</li>
            <li>Use natural daylight if possible</li>
            <li>Get closer than feels natural for tiny pests</li>
            <li>Avoid blurry or dark photos — we check before sending</li>
          </ul>
        </div>
      </div>
    </MobileLayout>
  );
}

function ChipGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => {
          const active = value === o;
          return (
            <button
              key={o}
              onClick={() => onChange(active ? null : o)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? "bg-leaf text-leaf-foreground shadow-leaf"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
