// Diagnose plant disease from an image using Lovable AI (Gemini vision)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are an expert plant pathologist. Given a photo of a plant, identify:
- the plant (best guess),
- whether it is healthy,
- the most likely disease/pest if unhealthy,
- severity (mild | moderate | severe),
- visible symptoms,
- recommended treatment (chemical/standard),
- organic/home treatment,
- prevention tips,
- a short product search query for buying treatment online.

Always respond by calling the diagnose function. If the image is not a plant, set is_healthy=false, disease_name="Not a plant", and explain in symptoms.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { image_url } = await req.json();
    if (!image_url) {
      return new Response(JSON.stringify({ error: "image_url required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not set");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: [
              { type: "text", text: "Diagnose this plant." },
              { type: "image_url", image_url: { url: image_url } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "diagnose",
              description: "Return plant diagnosis",
              parameters: {
                type: "object",
                properties: {
                  plant_name: { type: "string" },
                  is_healthy: { type: "boolean" },
                  disease_name: { type: "string" },
                  severity: { type: "string", enum: ["none", "mild", "moderate", "severe"] },
                  confidence: { type: "number", description: "0 to 1" },
                  symptoms: { type: "string" },
                  treatment: { type: "string" },
                  organic_treatment: { type: "string" },
                  prevention: { type: "string" },
                  shop_query: { type: "string" },
                },
                required: [
                  "plant_name",
                  "is_healthy",
                  "disease_name",
                  "severity",
                  "confidence",
                  "symptoms",
                  "treatment",
                  "organic_treatment",
                  "prevention",
                  "shop_query",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "diagnose" } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429)
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again soon." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      if (resp.status === 402)
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add credits in Lovable settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No diagnosis returned");
    const args = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(args), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("diagnose-plant error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
