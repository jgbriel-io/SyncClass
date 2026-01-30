import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          "react-vendor": ["react", "react-dom", "react/jsx-runtime"],
          
          // React Router
          "react-router": ["react-router-dom"],
          
          // React Query
          "react-query": ["@tanstack/react-query"],
          
          // Supabase
          supabase: ["@supabase/supabase-js"],
          
          // UI Components - Radix primitives
          "ui-primitives": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-popover",
            "@radix-ui/react-accordion",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-avatar",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-label",
            "@radix-ui/react-separator",
            "@radix-ui/react-slot",
            "@radix-ui/react-switch",
            "@radix-ui/react-tooltip",
          ],
          
          // Form libraries
          forms: ["react-hook-form", "zod", "@hookform/resolvers"],
          
          // Date utilities
          "date-utils": ["date-fns"],
          
          // Icons
          icons: ["lucide-react"],
          
          // Charts
          charts: ["recharts"],
        },
      },
    },
    // Aumentar o limite de warning para chunks grandes
    chunkSizeWarningLimit: 600,
  },
}));
