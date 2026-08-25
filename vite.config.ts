import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // Include fonts/icons so typography renders fully offline.
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}']
      },
      manifest: {
        id: '/',
        name: 'NUST Study App',
        short_name: 'StudyApp',
        description:
          'A simple, local-first hub to organize your courses, habits, tasks, and study resources.',
        display: 'standalone',
        theme_color: '#f5f7f8',
        background_color: '#f5f7f8',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-maskable-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts'
  }
});