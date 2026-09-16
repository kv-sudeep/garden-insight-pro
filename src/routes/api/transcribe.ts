import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return Response.json({ error: "AI is not configured." }, { status: 500 });

        const form = await request.formData();
        const file = form.get("file");
        if (!(file instanceof File))
          return Response.json({ error: "Audio file required." }, { status: 400 });
        if (file.size < 2048)
          return Response.json(
            { error: "That recording was empty — please try again." },
            { status: 400 }
          );
        if (file.size > 14 * 1024 * 1024)
          return Response.json({ error: "That recording is too long." }, { status: 400 });

        const upstream = new FormData();
        upstream.append("model", "google/gemini-3.5-transcribe");
        upstream.append("file", file, "recording.wav");

        const resp = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}` },
          body: upstream,
        });

        if (!resp.ok) {
          const detail = await resp.text().catch(() => "");
          console.error("transcription failed", resp.status, detail);
          if (resp.status === 429)
            return Response.json({ error: "Too many requests. Try again soon." }, { status: 429 });
          if (resp.status === 402)
            return Response.json(
              { error: "AI credits exhausted. Add credits in Lovable settings." },
              { status: 402 }
            );
          return Response.json(
            { error: "Could not transcribe the recording." },
            { status: 502 }
          );
        }

        const data = (await resp.json()) as { text?: string };
        return Response.json({ text: (data.text ?? "").trim() });
      },
    },
  },
});
