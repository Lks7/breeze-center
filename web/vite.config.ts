import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 4321,
    proxy: {
      // 把前端 /api 请求转发到 Go 后端
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
