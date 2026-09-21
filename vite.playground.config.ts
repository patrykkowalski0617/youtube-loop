import { defineConfig } from "vite";

const PLAYGROUND_PATH = "/watch?v=playground";

export default defineConfig({
  root: "playground",
  server: { open: PLAYGROUND_PATH },
});
