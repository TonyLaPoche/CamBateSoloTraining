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

## PWA

L’app est installable (écran d’accueil, mode `standalone` plein écran).

- **Android / Chrome desktop** : bandeau « Installer » ou menu ⋮ → Installer l’application
- **iPhone / iPad** : Safari → Partager → **Sur l’écran d’accueil**

Le service worker met en cache l’app + les modèles MediaPipe (démarrage plus rapide au 2ᵉ lancement).

## Déploiement GitHub Pages

Le workflow build `dist/` et le pousse sur la branche **`gh-pages`** à chaque push sur `main`.

**Activation (une fois) — c’est ce qui manquait pour le 404 :**

1. Ouvre [Settings → Pages](https://github.com/TonyLaPoche/CamBateSoloTraining/settings/pages)
2. **Build and deployment → Source** : **Deploy from a branch**
3. **Branch** : `gh-pages` / `/ (root)` → Save  
   *(si `gh-pages` n’existe pas encore : push ce workflow, attends le run vert, puis reviens choisir la branche)*
4. Relance le workflow si besoin : Actions → Deploy GitHub Pages → Run workflow

URL : https://tonylapoche.github.io/CamBateSoloTraining/

## Fonctionnalités

1. Pseudo 4–5 lettres → arène cam
2. Tracking **2 mains** + **visage** (yeux / bouche)
3. Bonus cumulables : mains jointes ×2 · 1 œil ×1.5 · 2 yeux ×4 · bouche ×2 · gonna cum ×3
4. HUD cam interactif (dwell / pinch)
5. Record `.webm` + sessions locales (IndexedDB)
6. UI responsive mobile

## DA

Fond `#0A0A0A`, accent `#FBFF4D`, brand `#AF9EFF`, gradient rouge→violet, fonts Mazzard + PPMonumentExtended.
