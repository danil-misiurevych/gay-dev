import { defineConfig } from 'vite';

export default defineConfig({
  // Wzgledna sciezka bazowa: ten sam build dziala na GitHub Pages
  // (w podkatalogu), na Netlify (w korzeniu) i w zipie dla Playgamy.
  base: './',
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        // Three.js w osobnym chunku — zmienia sie rzadko, wiec zostaje w cache
        // przegladarki miedzy wdrozeniami.
        manualChunks: { three: ['three'] },
      },
    },
  },
  server: { host: true },
});
