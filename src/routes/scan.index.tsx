import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Camera, Loader2, Upload } from "lucide-react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/device";
import { toast } from "sonner";

export const Route = createFileRoute("/scan/")({
  head: () => ({
    meta: [
      { title: "Scan a Plant — Plant Doctor" },
      { name: "description", content: "Take or upload a photo to diagnose your plant instantly." },
    ],
  }),
  component: ScanPage,
});

function ScanPage() {
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const navigate = useNavigate();

  async function handleFile(file: File) {
    if (!file) return;
    setBusy(true);
    try {
      const deviceId = getDeviceId();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${deviceId}/${crypto.randomUUID()}.${ext}`;

      setProgress("Uploading photo...");
      const { error: upErr } = await supabase.storage
        .from("scans")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("scans").getPublicUrl(path);
      const imageUrl = pub.publicUrl;

      setProgress("Diagnosing with AI...");
      const { data, error } = await supabase.functions.invoke("diagnose-plant", {
        body: { image_url: imageUrl },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);

      setProgress("Saving results...");
      const { data: scan, error: insErr } = await supabase
        .from("scans")
        .insert({
          device_id: deviceId,
          image_url: imageUrl,
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
          Get a clear photo of the affected leaves or stem. Good lighting helps accuracy.
        </p>

        <div className="mt-8 rounded-3xl bg-gradient-leaf p-8 text-center text-leaf-foreground shadow-leaf">
          {busy ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="h-10 w-10 animate-spin" />
              <p className="text-sm font-medium">{progress}</p>
            </div>
          ) : (
            <>
              <Camera className="mx-auto h-16 w-16" />
              <p className="mt-4 text-sm opacity-90">Tap below to start</p>
            </>
          )}
        </div>

        <div className="mt-6 grid gap-3">
          <Button
            size="lg"
            className="h-14 rounded-2xl bg-leaf text-leaf-foreground hover:bg-leaf/90"
            disabled={busy}
            onClick={() => cameraRef.current?.click()}
          >
            <Camera className="mr-2 h-5 w-5" /> Take photo
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-14 rounded-2xl"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="mr-2 h-5 w-5" /> Upload from gallery
          </Button>
        </div>

        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        <div className="mt-8 rounded-2xl bg-secondary p-4 text-sm text-secondary-foreground">
          <p className="font-semibold">📸 Tips for best results</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Focus on affected leaves up close</li>
            <li>Use natural daylight if possible</li>
            <li>Avoid blurry or dark photos</li>
          </ul>
        </div>
      </div>
    </MobileLayout>
  );
}
