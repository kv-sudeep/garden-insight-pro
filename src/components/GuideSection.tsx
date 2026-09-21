export function GuideSection({ title, body }: { title: string; body: string | null }) {
  if (!body) return null;
  return (
    <div className="mb-3 rounded-2xl bg-card p-4 shadow-soft">
      <h3 className="mb-1 text-sm font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

/** Splits a paragraph into readable numbered steps at sentence boundaries. */
export function splitSteps(text: string): string[] {
  return text
    .split(/\r?\n+|(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((s) => s.replace(/^\s*[-•\d.)\s]+/, "").trim())
    .filter((s) => s.length > 2);
}

export function StepList({ title, body }: { title: string; body: string | null }) {
  if (!body) return null;
  const steps = splitSteps(body);
  return (
    <div className="mb-3 rounded-2xl bg-card p-4 shadow-soft">
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      <ol className="space-y-2">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3 text-sm text-muted-foreground">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-leaf/15 text-[11px] font-semibold text-leaf">
              {i + 1}
            </span>
            <span className="leading-relaxed">{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
