import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

/** Repo GitHub Pages : https://tonylapoche.github.io/CamBateSoloTraining/ */
const REPO_BASE = "/CamBateSoloTraining/";

export default defineConfig({
  base: REPO_BASE,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
});
