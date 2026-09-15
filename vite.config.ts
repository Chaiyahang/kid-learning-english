import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import basicSsl from "@vitejs/plugin-basic-ssl";

const runtime = globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
};
const isPagesBuild = runtime.process?.env?.VITE_DEPLOY_TARGET === "github-pages";
const base = isPagesBuild ? "/kid-learning-english/" : "/";

export default defineConfig({
  base,
  plugins: [
    vue(),
    basicSsl({
      name: "kid-learning-english"
    })
  ],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true
  }
});
