import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import deno from "@deno/astro-adapter";

export default defineConfig({
  output: "server",
  adapter: deno(),
  integrations: [svelte()],
  server: {
    host: true,
    port: 4321,
  },
});
