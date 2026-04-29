import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg", "icon-180.png", "icon-192.png", "icon-512.png"],
      manifest: {
        name: "Wine About It",
        short_name: "Wine About It",
        description: "Discover, scan, and collect wines. Your AI sommelier in your pocket.",
        theme_color: "#2a1520",
        background_color: "#2a1520",
        display: "standalone",
        orientation: "portrait-primary",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "icon.svg",
            sizes: "any",
            type: "image/svg+xml",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            // Wine search — NetworkFirst so fresh results load when online,
            // cached results serve when offline
            urlPattern: ({ url }) => url.pathname.startsWith("/api/wines/search"),
            handler: "NetworkFirst",
            options: {
              cacheName: "wine-search",
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // AI enrichment — CacheFirst since tasting notes don't change
            urlPattern: ({ url }) => url.pathname.startsWith("/api/wines/enrich"),
            handler: "CacheFirst",
            options: {
              cacheName: "wine-enrich",
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
