import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";

/** Repo GitHub Pages : https://tonylapoche.github.io/CamBateSoloTraining/ */
const REPO_BASE = "/CamBateSoloTraining/";

export default defineConfig({
  base: REPO_BASE,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.svg",
        "icons/apple-touch-icon.png",
        "icons/icon-192.png",
        "icons/icon-512.png",
        "icons/maskable-192.png",
        "icons/maskable-512.png",
      ],
      manifest: {
        name: "CamBate Solo Training",
        short_name: "CamBate Solo",
        description:
          "Entraînement solo caméra : tracking mains/visage, score et record local.",
        lang: "fr",
        dir: "ltr",
        id: "/CamBateSoloTraining/",
        start_url: "./",
        scope: "./",
        display: "standalone",
        display_override: ["standalone", "fullscreen", "browser"],
        orientation: "any",
        background_color: "#0A0A0A",
        theme_color: "#0A0A0A",
        categories: ["entertainment", "fitness"],
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/maskable-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,svg,png,otf,woff2,webp}"],
        navigateFallback: "index.html",
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "mediapipe-wasm",
              expiration: {
                maxEntries: 16,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern:
              /^https:\/\/storage\.googleapis\.com\/mediapipe-models\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "mediapipe-models",
              expiration: {
                maxEntries: 8,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
});
