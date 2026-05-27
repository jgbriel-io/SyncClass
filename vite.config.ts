import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const supabaseUrl = env.VITE_SUPABASE_URL ?? "";

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
      // Em dev, proxy para Edge Functions evita CORS (request same-origin)
      proxy: supabaseUrl
        ? {
            "/supabase-functions": {
              target: supabaseUrl,
              changeOrigin: true,
              secure: false,
              ws: false,
              // Preservar todos os headers da requisição original
              headers: {
                // Estes headers serão adicionados se não existirem
              },
              rewrite: (path) =>
                path.replace(/^\/supabase-functions/, "/functions/v1"),
            },
          }
        : undefined,
    },
    plugins: [
      react(),
      // ⚡ P0-3: PWA Plugin para experiência de app nativo
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.png", "icons/*.png"],
        manifest: false, // Usar manifest.json manual
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
              handler: "NetworkFirst",
              options: {
                cacheName: "supabase-api",
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24, // 24 horas
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false, // Desabilitar PWA em dev para evitar logs do Workbox
        },
      }),
    ].filter(Boolean),
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

            // lucide-react removido de manualChunks: ícones são tree-shaken
            // e distribuídos nos chunks que os usam (evita bundle de 20KB+)

            // Charts
            charts: ["recharts"],
          },
        },
      },
      // Aumentar o limite de warning para chunks grandes
      chunkSizeWarningLimit: 600,
    },
  };
});
