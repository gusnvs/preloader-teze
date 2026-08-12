import { defineConfig } from 'vite';

export default defineConfig({
  // SPA fallback: qualquer rota (/, /descobertas) devolve o index.html,
  // condicao para o roteador de History API funcionar sem reload.
  appType: 'spa',
  server: {
    port: 5173,
    open: false,
  },
  build: {
    target: 'es2020',
    assetsInlineLimit: 2048, // SVGs pequenos viram data-uri, PNGs continuam arquivos
    rollupOptions: {
      output: {
        manualChunks: {
          gsap: ['gsap'],
          // Separado do app: a física só é usada pela cena 3, e isolá-la
          // deixa visível o que ela custa — e fácil de trocar por outra.
          fisica: ['matter-js'],
        },
      },
    },
  },
});
