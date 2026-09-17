# 🌿 Plant Doctor (KrushiMitra AI)

A mobile-first AI app that diagnoses plant diseases from a single photo and helps you care for your plants — scan, diagnose, treat, and track everything in one place.

## ✨ Features

### 📸 Scan & AI Diagnosis
- **Scan page (`/scan`)** — take a photo with the camera or upload one from the gallery.
- **Multi-angle capture** — three slots (whole plant, leaf underside, close-up); one photo is enough, but all three are combined into a single, more reliable diagnosis.
- **Photo quality check** — every photo is scored for lighting and blur before sending, with a badge, a tip on how to improve it, and a confirmation prompt if you submit a poor photo.
- **Voice symptom notes** — record a spoken description; it is transcribed automatically and can be edited before sending.
- **"Not sure what's wrong?"** — three quick questions (worst affected part, when it started, recent care change) added to the diagnosis as supporting evidence.
- **Repeat scan detection** — the same photo scanned twice offers the earlier result instead of re-diagnosing.
- Photos upload to cloud storage, then the `diagnose-plant` AI function (Gemini vision via Lovable AI) analyzes them together with your notes.
- Progress feedback at each step: *Uploading → Diagnosing → Saving*.
- AI returns: plant name, health status, disease name, severity (mild/moderate/severe), confidence %, symptoms, treatment, organic treatment, prevention tips, and a product shop query.

### 🩺 Scan Results (`/scan/$scanId`)
- **3D photo preview** — drag to rotate, pinch/scroll to zoom, reset button; your photo floats as a glossy 3D card with blurred backdrop.
- Health badge + severity + confidence meter.
- **Clear treatment steps** — numbered chemical treatment, organic remedy, and prevention steps.
- **Next actions panel** — contextual guidance (watering, tracking, prevention, re-scan reminders) with glossy 3D clay icons.
- **3D action buttons** — buy treatment online (shop link) and **Save to My Garden**.

### 🪴 My Garden (`/garden`)
- All saved plants with photo, health status, and notes.
- **Search bar** — find plants by name or notes.
- **Sort options** — newest first, name A–Z.
- **Category filter chips** with live match counts.
- **Bulk selection** — select multiple plants for bulk delete or bulk logging; **Undo snackbar (6s)** restores accidentally deleted plants.
- **One-tap quick actions** on each card — log *Watered / Repotted / Fertilized* instantly.
- **Edit mode with note templates** — quick-add common action notes while editing.
- **Care reminders panel** — upcoming tasks computed from your note history.
- Edit notes and delete plants anytime.

### 📚 Plant Library (`/library`)
- Browse care info for 100+ plants — seeded starter set across **Vegetables, Herbs, Houseplants, Flowers, Fruits**.
- **Search bar** plus **category filter chips** for fast filtering.
- **Detail pages (`/library/$plantId`)** — watering, sunlight, soil needs, and common diseases per plant.

### 🏠 Home (`/`)
- Hero with **3D Pixar-style illustration**, animated "AI-powered" badge, and scan CTA.
- Feature chips with **glossy 3D clay icons** (plants covered, treatment plans, instant AI).
- **Recent scans** grid linking straight to results.

### 🎬 Splash Screen & 3D Design
- Animated **3D KrushiMitra AI** splash on first open each session — pops in, floats, fades out.
- Whole app styled with a **3D glossy/claymation language**: layered shadows, depth slabs, rounded cards, custom 3D icon set.
- Mobile-first layout with bottom tab navigation (Home, Scan, Garden, Library) using 3D icons.

## 🧱 Tech Stack
- **TanStack Start** (React 19, Vite 7, SSR) — TanStack Router for routing.
- **Tailwind CSS v4** with semantic design tokens (`leaf`, `shadow-leaf`, gradients) in `src/styles.css`.
- **shadcn/ui** components + **sonner** toasts.
- **Lovable Cloud (backend)** — database with row-level security, cloud storage for photos.
- **Lovable AI Gateway** — Gemini vision model for diagnosis.

## 🗄️ Data Model
| Table | Purpose |
|---|---|
| `scans` | Every diagnosis: photo URL, plant, disease, severity, confidence, treatment fields |
| `garden_plants` | Saved plants with notes, category, care history |
| `plant_library` | Care guide catalog (name, scientific name, category, water/sunlight/soil, common diseases) |

Photos are stored in the `scans` storage bucket; scans are keyed by anonymous `device_id` so no sign-up is needed.

## 🔌 AI Flow
1. Client uploads photo → gets public URL.
2. Client calls `diagnose-plant` edge function (`supabase/functions/diagnose-plant`).
3. Function calls Lovable AI (Gemini 2.5 Flash) with a strict structured-output schema.
4. Result is inserted into `scans` and the app navigates to the results page.

## 🚀 Getting Started
```bash
bun install
bun run dev
```
Open the preview, tap **Scan a plant**, and diagnose your first leaf.

## 📁 Project Structure
```
src/
  assets/          # 3D clay icons, hero art, splash logo
  components/      # MobileLayout, Photo3DPreview, SplashScreen, UI kit
  lib/             # device id + utils
  routes/          # /, /scan, /scan/$scanId, /garden, /library
supabase/
  functions/diagnose-plant/   # AI diagnosis function
  migrations/                 # schema + seed data
```
