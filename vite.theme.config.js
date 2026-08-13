import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

/**
 * BUILD PARA O TEMA MORELIA (Nuvemshop).
 *
 * O laboratorio continua com `vite.config.js`: modulos ES, varios chunks,
 * hash no nome. Nada disso serve do outro lado. Um tema de loja e uma pasta
 * de arquivos enviada por FTP, sem etapa de build, sem mapa de importacoes e
 * sem garantia de que a plataforma sirva `type="module"` com os cabecalhos
 * certos. Entao o alvo aqui e o oposto: UM arquivo, sem imports, com nome
 * estavel.
 *
 *   laboratorio           tema
 *   ------------------    ------------------------------
 *   3 chunks + hash       1 IIFE, `tz-preloader.js`
 *   ESM                   nenhum modulo em tempo de execucao
 *   assets pelo Vite      assets pela plataforma (ver `assets.js`)
 *
 * GSAP, os tres plugins e o matter-js entram DENTRO do arquivo. Auto-hospedar
 * e a unica opcao honesta aqui: uma loja nao deve depender de um CDN de
 * terceiros para conseguir mostrar a propria pagina inicial, e o tema nao
 * carrega nenhum deles hoje — nao ha versao com que colidir.
 *
 *     npm run build:theme
 */
export default defineConfig({
  build: {
    // O tema roda em navegadores de loja, nao em um laboratorio. Este alvo
    // cobre Safari 13+ sem precisar de polyfill nenhum.
    target: 'es2019',

    outDir: 'dist-theme',
    emptyOutDir: true,

    // Uma folha de estilo so. `cssCodeSplit` dividiria por chunk — e chunk,
    // aqui, nao existe.
    cssCodeSplit: false,

    // Nada de data-uri: as imagens sao servidas pela plataforma, com o hash
    // de versao dela. Inlinar qualquer uma inflaria o bundle com um endereco
    // que nunca sera usado.
    assetsInlineLimit: 0,

    rollupOptions: {
      input: fileURLToPath(new URL('src/theme/entry.js', import.meta.url)),
      output: {
        format: 'iife',
        // Sem `name`: o entry nao exporta nada, e um global a mais seria
        // exatamente o que se pediu para evitar. O que precisa ser alcancavel
        // de fora, o proprio entry publica em `window.TZPreloader`.
        entryFileNames: 'tz-preloader.js',
        inlineDynamicImports: true,
        /**
         * Nomes estaveis, sem hash: quem versiona os arquivos e a Nuvemshop,
         * pelo filtro `static_url`. Um hash aqui criaria dois sistemas de
         * cache-busting disputando o mesmo arquivo.
         *
         * As imagens ainda passam pelo empacotador (o `import.meta.glob` de
         * `assets.js` continua existindo para o laboratorio), mas o que sai
         * daqui e descartado: quem copia a arte para o tema, com o nome
         * original, e `scripts/build-theme.mjs`.
         */
        assetFileNames: (info) => {
          const nome = info.names?.[0] ?? info.name ?? '';
          if (nome.endsWith('.css')) return 'tz-preloader.css';
          return 'descartar/[name][extname]';
        },
      },
    },
  },
});
