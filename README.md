# CamBate Solo Training

Entraînement solo local : caméra + tracking de main (MediaPipe) + score type clicker + record de session.

## Stack

- **Vite + React 19 + TypeScript** — SPA locale, idéale pour cam / WASM / MediaRecorder
- **Tailwind CSS 4** — DA alignée Batemates
- **@mediapipe/tasks-vision** — Hand Landmarker (100 % navigateur)

Pas de Next.js : pas besoin de SSR pour une app cam locale.

## Lancer

```bash
npm install
npm run dev
```

Ouvre `http://localhost:5173` (la caméra exige localhost ou HTTPS).

## Fonctionnalités MVP

1. Activation caméra
2. Tracking **2 mains** + **visage** (yeux / bouche précis, blendshapes)
3. Fap 1 ou 2 mains · main près du visage = **vape** (nez) / **poppers** (bouche)
4. États visage : yeux ouverts/fermés, bouche ouverte/fermée, langue dehors
5. **HUD cam interactif** : Start fap / Rec / I'm gonna cum — pinch ou dwell
6. Record live → `.webm` · stats en `localStorage`

## DA

Palette et typos Batemates : fond `#0A0A0A`, accent `#FBFF4D`, brand `#AF9EFF`, gradient rouge→violet, fonts Mazzard + PPMonumentExtended.
