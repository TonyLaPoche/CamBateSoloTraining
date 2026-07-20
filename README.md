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
2. Détection de main + comptage de pumps (mouvement haut/bas du poing)
3. Score + combo + multiplicateurs
4. Record live (cam miroir + skeleton + HUD score) → téléchargement `.webm`
5. Stats best score / best combo en `localStorage`

## DA

Palette et typos Batemates : fond `#0A0A0A`, accent `#FBFF4D`, brand `#AF9EFF`, gradient rouge→violet, fonts Mazzard + PPMonumentExtended.
