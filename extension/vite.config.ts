import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import path from 'node:path';
import { readFileSync } from 'node:fs';

// Load the manifest as a real object so crxjs handles MV3 properly and
// derives the correct entry points (background SW, content scripts, popup/welcome/settings).
const manifest = JSON.parse(
  readFileSync(path.resolve(__dirname, 'manifest.json'), 'utf-8'),
);

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
  ],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@background': path.resolve(__dirname, 'src/background'),
      '@content': path.resolve(__dirname, 'src/content'),
    },
  },
  build: {
    target: 'chrome110',
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        welcome: path.resolve(__dirname, 'src/welcome/welcome.html'),
        settings: path.resolve(__dirname, 'src/settings/settings.html'),
        premium: path.resolve(__dirname, 'src/premium/premium.html'),
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
  },
});
