/**
 * PONTO DE ENTRADA
 *
 * Costura tres pecas independentes:
 *
 *   Router      sabe trocar o conteudo, nao sabe animar
 *   Preloader   sabe animar, nao sabe o que e uma rota
 *   main.js     conhece os dois e define o contrato entre eles
 *
 * O contrato e uma unica linha: a pagina so troca quando o pre-loader
 * avisa que a tela esta coberta.
 */

import './styles/tokens.css';
import './styles/base.css';
import './styles/peel.css';
import './styles/preloader.css';
import './styles/pages.css';

import { Router } from './utils/router.js';
import { Preloader } from './animations/preloader/Preloader.js';
import { ROUTES } from './pages/index.js';
import { qs } from './utils/dom.js';

const outlet = qs('[data-outlet]');
const preloaderRoot = qs('#preloader-root');

const preloader = new Preloader({
  root: preloaderRoot,
  // A pagina e buscada no momento do uso: entre o inicio e o fim de uma
  // transicao o no muda de identidade.
  getPage: () => outlet.firstElementChild,
});

const router = new Router({
  routes: ROUTES,
  outlet,
  onTransition: async ({ commit }) => {
    // Navegacao seguinte: mesma historia, respiracao mais curta.
    await preloader.run({ variant: 'express', onCommit: commit });
  },
});

/** Primeira visita: a versao completa da historia. */
async function boot() {
  router.start();

  await preloader.prepare();

  await preloader.run({
    variant: 'full',
    onCommit: () => {
      // A pagina ja esta montada atras da colagem; aqui ela apenas deixa
      // de estar escondida, e a cena 8 cuida da revelacao.
      document.body.classList.remove('is-booting');
    },
  });
}

// `?lab=peel` abre o laboratorio da figurinha em vez da experiencia: uma
// figurinha so, parada, com o progresso na mao. E onde a fisica da colagem e
// julgada — assistir a transicao inteira nao mostra o que acontece entre dois
// quadros. So existe em desenvolvimento.
const laboratorio =
  import.meta.env.DEV && new URLSearchParams(location.search).get('lab') === 'peel';

if (laboratorio) {
  import('./utils/peelLab.js').then(({ mountPeelLab }) => mountPeelLab());
} else {
  boot();
}

// Ferramentas de direcao de arte — apenas em desenvolvimento.
if (import.meta.env.DEV && !laboratorio) {
  import('./utils/devtools.js').then(({ mountDevTools }) => {
    mountDevTools({ preloader, router });
  });
}
