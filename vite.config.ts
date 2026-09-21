import { defineConfig } from "vite";
import zipPack from "vite-plugin-zip-pack";

import { crx } from "@crxjs/vite-plugin";

import manifest from "./manifest.json" with { type: "json" };

const RELEASE_DIR = "release";

export default defineConfig({
  plugins: [
    crx({ manifest }),
    zipPack({
      inDir: "dist",
      outDir: RELEASE_DIR,
      outFileName: `youtube-loop-${manifest.version}.zip`,
    }),
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
  },
});
