import { createFileRoute } from "@tanstack/react-router";

const SYSTEM = `You are an expert botanist and horticulturist. Given photos of an unknown plant, identify the species as precisely as possible.

Always answer by calling the identify function. If the photo is not a plant, set common_name to "Not a plant" and explain in summary.
Be specific and practical in the care fields. Keep each field to 1-3 short sentences. Never invent a scientific name you are not reasonably confident about — say so in summary instead.`;

export const Route = createFileRoute("/api/identify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return Response.json({ error: "AI is not configured." }, { status: 500 });

        const body = (await request.json()) as {
          images?: { label?: string; url: string }[];
          notes?: string;
        };
        const images = (body.images ?? []).filter((i) => typeof i?.url === "string");
        if (images.length === 0)
          return Response.json({ error: "At least one photo is required." }, { status: 400 });
        const notes = (body.notes ?? "").trim();

        const content: unknown[] = [
          {
            type: "text",
            text:
              images.length > 1
                ? `Identify this plant. ${images.length} photos of the SAME plant are attached. Combine them into one identification.`
                : "Identify this plant.",
          },
        ];
        for (const img of images) {
          if (img.label) content.push({ type: "text", text: `View: ${img.label}` });
          content.push({ type: "image_url", image_url: { url: img.url } });
        }
        if (notes)
          content.push({
            type: "text",
            text: `Extra details from the person who took the photo:\n${notes}`,
          });

        const fields = [
          "common_name",
          "scientific_name",
          "family",
          "also_known_as",
          "summary",
          "water",
          "sunlight",
          "soil",
          "soil_ph",
          "toxicity",
          "edible_parts",
          "native_range",
          "invasive_notes",
          "common_mistakes",
          "companion_plants",
          "similar_plants",
          "care_calendar",
        ];

        const properties: Record<string, unknown> = { confidence: { type: "number" } };
        for (const f of fields) properties[f] = { type: "string" };

        const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: SYSTEM },
              { role: "user", content },
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "identify",
                  description: "Return the plant identification and care profile",
                  parameters: {
                    type: "object",
                    properties,
                    required: [...fields, "confidence"],
                    additionalProperties: false,
                  },
                },
              },
            ],
            tool_choice: { type: "function", function: { name: "identify" } },
          }),
        });

        if (!resp.ok) {
          const detail = await resp.text().catch(() => "");
          console.error("identify failed", resp.status, detail);
          if (resp.status === 429)
            return Response.json({ error: "Too many requests. Try again soon." }, { status: 429 });
          if (resp.status === 402)
            return Response.json(
              { error: "AI credits exhausted. Add credits in Lovable settings." },
              { status: 402 }
            );
          return Response.json({ error: "Could not identify the plant." }, { status: 502 });
        }

        const data = (await resp.json()) as {
          choices?: { message?: { tool_calls?: { function: { arguments: string } }[] } }[];
        };
        const call = data.choices?.[0]?.message?.tool_calls?.[0];
        if (!call) return Response.json({ error: "No identification returned." }, { status: 502 });
        return Response.json(JSON.parse(call.function.arguments));
      },
    },
  },
});
