import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime — cached forever, changes only on React upgrades
          "vendor-react": ["react", "react-dom"],
          // Router — separate chunk, very stable
          "vendor-router": ["react-router-dom"],
          // Data fetching
          "vendor-query": ["@tanstack/react-query"],
          // HTTP client
          "vendor-axios": ["axios"],
          // Icon library — large, rarely changes
          "vendor-icons": ["lucide-react"],
        },
      },
    },
  },
}));
