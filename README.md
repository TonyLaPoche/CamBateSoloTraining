# CamBate Solo Training

> **18+** — Web app d’entraînement solo pour adultes. 100 % locale, basée caméra, sans compte ni upload.

Petit terrain d’expérimentation à la croisée de la **computer vision temps réel**, de l’**HCI** et du **biofeedback gamifié**.

Tu t’entraînes devant ta webcam. Le navigateur suit les mains et le visage (MediaPipe), transforme le mouvement en score, et peut enregistrer la session — entièrement sur l’appareil.

Le bien-être sexuel solo est un vrai cas d’usage. Le construire est aussi un excellent terrain technique : inférence basse latence dans le navigateur, interaction bi-manuelle, UX caméra en miroir, PWA installable, et vie privée by design (rien ne quitte la machine).

**Live :** [https://tonylapoche.github.io/CamBateSoloTraining/](https://tonylapoche.github.io/CamBateSoloTraining/)

## Pourquoi ce projet

- **Besoin** — un feedback clair pendant la pratique solo, plutôt que d’y aller au feeling.
- **Tech** — MediaPipe Hands + Face dans une app React/Vite, HUD cam interactif, bibliothèque de sessions IndexedDB.
- **Ressenti** — boucles courtes, paliers, enregistrement optionnel pour revoir sa propre session.

Si ce mélange n’est pas pour toi, aucun souci. Sinon : profite, reste en local, reste respectueux.

## Confidentialité

- Flux caméra traité **uniquement dans le navigateur**
- Sessions / vidéos stockées en **IndexedDB** sur ton appareil
- Pas de backend, pas de pipeline analytics, pas de sync cloud dans cette version

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

**Activation (une fois) :**

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
4. Main dominante (droitier / gaucher / auto) · vape / poppers
5. HUD cam interactif (dwell / pinch)
6. Record `.webm` + sessions locales (IndexedDB) — annonces & countdown inclus, overlays tracking masqués
7. UI responsive mobile + i18n FR/EN

## DA

Fond `#0A0A0A`, accent `#FBFF4D`, brand `#AF9EFF`, gradient rouge→violet, fonts Mazzard + PPMonumentExtended.
