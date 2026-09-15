import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig({
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
