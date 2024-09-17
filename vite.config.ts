import react from "@vitejs/plugin-react";
import sass from "sass";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        implementation: sass,
      },
    },
  },
  publicDir: "public",
  server: {
    hmr: true,
  },
  build: {
    target: "esnext",
  },
  base: process.env.NODE_ENV === "development" && import.meta.env?.VITE_CODE_SERVER ? "/absproxy/5173" : "/",
});
