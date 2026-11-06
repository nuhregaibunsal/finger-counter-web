import { defineConfig } from "vite";

export default defineConfig({
  base: "/finger-counter-web/",
  build: { target: "es2022" },
  test: { environment: "node" },
});
