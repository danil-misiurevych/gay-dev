import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base path: the same build works on GitHub Pages (in a
  // subdirectory), on Netlify (at the root) and in a zip for Playgama.
  base: './',
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        // Three.js in its own chunk — it changes rarely, so it stays in the
        // browser cache between deployments.
        manualChunks: { three: ['three'] },
      },
    },
  },
  server: {
    host: true,
    // Tunnels (ngrok and friends) are how we test on a real phone without
    // being on the same network. Vite rejects unknown Host headers by
    // default, and a free ngrok domain changes on every restart, so the
    // whole suffix is allowed rather than one address. Dev server only —
    // this has no effect on the production build.
    allowedHosts: ['.ngrok-free.app', '.ngrok.io', '.trycloudflare.com'],
  },
});
