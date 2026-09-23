import type { GardenPlant } from "./garden";
import { displayName } from "./garden";

const CSV_COLS = [
  "name",
  "nickname",
  "species",
  "category",
  "location",
  "bed",
  "soil_type",
  "tags",
  "notes",
  "acquired_on",
  "created_at",
] as const;

function esc(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function plantsToCsv(plants: GardenPlant[]): string {
  const head = CSV_COLS.join(",");
  const rows = plants.map((p) =>
    CSV_COLS.map((c) => {
      if (c === "tags") return esc((p.tags ?? []).join("; "));
      return esc((p as unknown as Record<string, unknown>)[c]);
    }).join(",")
  );
  return [head, ...rows].join("\n");
}

export function downloadFile(filename: string, content: string, type = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Opens a clean printable sheet — the browser's print dialog saves it as PDF. */
export function printGardenPdf(plants: GardenPlant[]) {
  const rows = plants
    .map(
      (p) => `<tr>
        <td>${escapeHtml(displayName(p))}</td>
        <td>${escapeHtml(p.name)}</td>
        <td>${escapeHtml(p.species ?? "")}</td>
        <td>${escapeHtml(p.category ?? "")}</td>
        <td>${escapeHtml(p.location ?? "")}</td>
        <td>${escapeHtml((p.tags ?? []).join(", "))}</td>
        <td>${escapeHtml(p.archived_at ? "Archived" : "Growing")}</td>
      </tr>`
    )
    .join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>My Garden</title>
  <style>
    body{font-family:ui-sans-serif,system-ui,sans-serif;padding:28px;color:#14281d}
    h1{margin:0 0 4px;font-size:22px}
    p{margin:0 0 18px;color:#5b7566;font-size:12px}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th,td{border-bottom:1px solid #dfe9e2;padding:7px 6px;text-align:left;vertical-align:top}
    th{background:#eef6f0;font-size:11px;text-transform:uppercase;letter-spacing:.04em}
  </style></head><body>
  <h1>My Garden</h1>
  <p>${plants.length} plant${plants.length === 1 ? "" : "s"} · exported ${new Date().toLocaleDateString()}</p>
  <table><thead><tr><th>Plant</th><th>Name</th><th>Species</th><th>Category</th><th>Spot</th><th>Labels</th><th>Status</th></tr></thead>
  <tbody>${rows}</tbody></table></body></html>`;
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
  return true;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

export type ImportedPlant = {
  name: string;
  nickname: string | null;
  species: string | null;
  category: string | null;
  location: string | null;
  bed: string | null;
  soil_type: string | null;
  tags: string[];
  notes: string | null;
};

/** Tolerant CSV parser: accepts our own export plus common columns from other plant apps. */
export function parsePlantCsv(text: string): { plants: ImportedPlant[]; skipped: number } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { plants: [], skipped: 0 };
  const header = splitCsvLine(lines[0]!).map((h) => h.toLowerCase().replace(/[\s_-]+/g, ""));
  const idx = (...names: string[]) => {
    for (const n of names) {
      const i = header.indexOf(n.replace(/[\s_-]+/g, ""));
      if (i !== -1) return i;
    }
    return -1;
  };
  const cols = {
    name: idx("name", "plant", "plantname", "commonname", "title"),
    nickname: idx("nickname", "customname", "label"),
    species: idx("species", "scientificname", "botanicalname", "latinname"),
    category: idx("category", "type", "group"),
    location: idx("location", "room", "place", "spot"),
    bed: idx("bed", "pot", "container"),
    soil: idx("soiltype", "soil", "substrate"),
    tags: idx("tags", "labels"),
    notes: idx("notes", "note", "description", "comment"),
  };
  const plants: ImportedPlant[] = [];
  let skipped = 0;
  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line);
    const get = (i: number) => (i >= 0 ? (cells[i] ?? "").trim() : "");
    const name = get(cols.name);
    if (!name) {
      skipped++;
      continue;
    }
    plants.push({
      name,
      nickname: get(cols.nickname) || null,
      species: get(cols.species) || null,
      category: get(cols.category) || null,
      location: get(cols.location) || null,
      bed: get(cols.bed) || null,
      soil_type: get(cols.soil) || null,
      tags: get(cols.tags)
        .split(/[;|,]/)
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
      notes: get(cols.notes) || null,
    });
  }
  return { plants, skipped };
}
