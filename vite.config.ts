import react from "@vitejs/plugin-react";
import sass from "sass";
import { defineConfig, loadEnv } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
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
      port: 5173
    },
    build: {
      target: "esnext",
    },
    base:
      process.env.NODE_ENV === "development" &&
      env?.VITE_CODE_SERVER
        ? "/absproxy/5173"
        : "/",
  };
});
