import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background/service-worker.ts'),
        options: resolve(__dirname, 'options.html'),
        popup: resolve(__dirname, 'popup.html'),
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === 'background' ? 'assets/background.js' : 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
