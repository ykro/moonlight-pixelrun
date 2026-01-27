import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'esnext',
    minify: 'terser',
  },
  server: {
    host: true,
    port: 5173,
  },
});
