import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["favicon.svg", "app-icon-192.png", "app-icon-512.png", "app-icon-maskable-512.png"],
      manifest: {
        name: "Vendaura POS",
        short_name: "Vendaura",
        description: "Point of sale for restaurants, bars and markets",
        theme_color: "#08090d",
        background_color: "#08090d",
        display: "standalone",
        start_url: "/javari-web/",
        scope: "/javari-web/",
        icons: [
          { src: "app-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "app-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "app-icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          { src: "logo.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
        ],
      },
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.qrserver\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "qr-codes",
              expiration: { maxEntries: 20, maxAgeSeconds: 2592000 },
            },
          },
        ],
      },
    }),
  ],
  base: "/javari-web/",
});
