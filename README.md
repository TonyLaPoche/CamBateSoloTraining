# CamBate Solo Training

Entraînement solo : caméra + tracking main/visage (MediaPipe) + score type clicker + record de session.

**Live :** [https://tonylapoche.github.io/CamBateSoloTraining/](https://tonylapoche.github.io/CamBateSoloTraining/)

## Stack

- **Vite + React 19 + TypeScript**
- **Tailwind CSS 4**
- **@mediapipe/tasks-vision** (Hand + Face Landmarker, 100 % navigateur)

## Lancer en local

```bash
npm install
npm run dev
```

Ouvre `http://localhost:5173/CamBateSoloTraining/` (le `base` Vite est celui de GitHub Pages).  
La caméra exige **localhost** ou **HTTPS**.

## Déploiement GitHub Pages

Le workflow `.github/workflows/deploy-pages.yml` build et publie `dist/` à chaque push sur `main`.

**Une fois :**

1. Repo → **Settings** → **Pages**
2. Source : **GitHub Actions**
3. Push sur `main` (ou lance le workflow manuellement)

URL : `https://<user>.github.io/CamBateSoloTraining/`

## Fonctionnalités

1. Pseudo 4–5 lettres → arène cam
2. Tracking **2 mains** + **visage** (yeux / bouche)
3. Bonus cumulables : mains jointes ×2 · 1 œil ×1.5 · 2 yeux ×4 · bouche ×2 · gonna cum ×3
4. HUD cam interactif (dwell / pinch)
5. Record `.webm` + sessions locales (IndexedDB)
6. UI responsive mobile

## DA

Fond `#0A0A0A`, accent `#FBFF4D`, brand `#AF9EFF`, gradient rouge→violet, fonts Mazzard + PPMonumentExtended.
