/**
 * FERRAMENTAS DE DIRECAO DE ARTE (apenas em `npm run dev`)
 *
 * Ajustar uma animacao de seis segundos recarregando a pagina a cada tweak
 * e insustentavel. Este painel existe para que a cena possa ser vista
 * quadro a quadro, isolada e no ritmo que o olho precisa.
 *
 *   R        repete a transicao
 *   1 … 8    salta para o inicio da cena correspondente
 *   S        alterna camera lenta (0.25x)
 *   G        abre o GSDevTools (barra de scrub da GreenSock)
 *   C        mostra a grade de composicao (eixos de 10%)
 *   H        esconde o painel
 *
 * Tambem le parametros de URL:
 *   ?slow=0.2      escala de tempo inicial
 *   ?scene=mural   salta direto para uma cena ao carregar
 */

import { gsap } from 'gsap';

const SCENE_KEYS = [
  ['1', 'awaken', 'despertar'],
  ['2', 'gather', 'reuniao'],
  ['3', 'mural', 'mural'],
  ['4', 'rastro', 'rastro + reacao'],
  ['5', 'rastro', 'rastro + reacao'],
  ['6', 'breeze', 'brisa'],
  ['7', 'fall', 'queda'],
  ['8', 'reveal', 'revelacao'],
];

const STYLE = `
.tz-dev {
  position: fixed; right: 14px; top: 14px; z-index: 1000;
  display: grid; gap: 8px; min-width: 208px; padding: 12px 14px;
  font: 11px/1.5 'Courier Prime', ui-monospace, monospace;
  color: #F4EDDF; background: rgba(20,18,16,.88);
  border: 1px solid rgba(244,237,223,.16); border-radius: 3px;
  backdrop-filter: blur(6px); pointer-events: auto;
}
.tz-dev[hidden] { display: none; }
.tz-dev__title {
  display: flex; justify-content: space-between; gap: 12px;
  letter-spacing: .18em; text-transform: uppercase; opacity: .55; font-size: 9px;
}
.tz-dev__row { display: flex; justify-content: space-between; gap: 10px; }
.tz-dev__row b { font-weight: 400; color: #E3B33F; }
.tz-dev__keys { display: grid; gap: 2px; opacity: .62; font-size: 10px; }
.tz-dev__keys span b { display: inline-block; min-width: 42px; color: #C9505A; font-weight: 400; }
.tz-grid {
  position: fixed; inset: 0; z-index: 999; pointer-events: none;
  background-image:
    repeating-linear-gradient(to right, rgba(168,32,42,.32) 0 1px, transparent 1px 10%),
    repeating-linear-gradient(to bottom, rgba(168,32,42,.32) 0 1px, transparent 1px 10%);
}
.tz-grid::after {
  content: ''; position: absolute; inset: 0;
  background:
    linear-gradient(to right, transparent calc(50% - 1px), rgba(42,75,107,.6) 50%, transparent calc(50% + 1px)),
    linear-gradient(to bottom, transparent calc(50% - 1px), rgba(42,75,107,.6) 50%, transparent calc(50% + 1px));
}
`;

export function mountDevTools({ preloader, router }) {
  const params = new URLSearchParams(window.location.search);
  const initialScale = parseFloat(params.get('slow') ?? '') || 1;
  const initialScene = params.get('scene');

  let scale = initialScale;
  let slowMotion = initialScale !== 1;
  let gsDevToolsLoaded = false;

  const style = document.createElement('style');
  style.textContent = STYLE;
  document.head.appendChild(style);

  const panel = document.createElement('aside');
  panel.className = 'tz-dev';
  panel.innerHTML = `
    <div class="tz-dev__title"><span>Tezê · direcao</span><span>dev</span></div>
    <div class="tz-dev__row"><span>escala</span><b data-scale>${scale}x</b></div>
    <div class="tz-dev__row"><span>duracao</span><b data-duration>—</b></div>
    <div class="tz-dev__row"><span>pecas</span><b data-pieces>—</b></div>
    <div class="tz-dev__keys">
      <span><b>R</b>repetir</span>
      <span><b>1-8</b>cena</span>
      <span><b>S</b>camera lenta</span>
      <span><b>G</b>gsdevtools</span>
      <span><b>C</b>grade</span>
      <span><b>H</b>ocultar</span>
    </div>`;
  document.body.appendChild(panel);

  const scaleEl = panel.querySelector('[data-scale]');
  const durationEl = panel.querySelector('[data-duration]');
  const piecesEl = panel.querySelector('[data-pieces]');

  const grid = document.createElement('div');
  grid.className = 'tz-grid';
  grid.hidden = true;
  document.body.appendChild(grid);

  const refresh = () => {
    const tl = preloader.timeline;
    scaleEl.textContent = `${scale}x`;
    durationEl.textContent = tl ? `${tl.duration().toFixed(2)}s` : '—';
    const stage = preloader.stageData;
    if (stage) {
      const visible = stage.pieces.filter((piece) => piece.present !== false).length;
      piecesEl.textContent = `${visible}/${stage.pieces.length}`;
    }
  };

  const applyScale = () => {
    preloader.timeline?.timeScale(scale);
    refresh();
  };

  /** Repete a transicao sem trocar de rota. */
  const replay = async () => {
    if (preloader.isRunning) return;
    await preloader.run({ variant: 'full', timeScale: scale });
    refresh();
  };

  const seekScene = (label) => {
    const tl = preloader.timeline;
    if (!tl) return;
    const time = tl.labels[label];
    if (time == null) {
      console.warn(`[dev] rotulo desconhecido: ${label}`, Object.keys(tl.labels));
      return;
    }
    tl.seek(time);
  };

  const openGSDevTools = async () => {
    if (gsDevToolsLoaded) return;
    const { GSDevTools } = await import('gsap/GSDevTools');
    gsap.registerPlugin(GSDevTools);
    gsDevToolsLoaded = true;
    if (preloader.timeline) {
      GSDevTools.create({ animation: preloader.timeline, css: { zIndex: 1001 } });
    } else {
      console.info('[dev] rode a transicao (R) e pressione G novamente');
      gsDevToolsLoaded = false;
    }
  };

  document.addEventListener('keydown', (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (/^(input|textarea)$/i.test(event.target.tagName)) return;

    const key = event.key.toLowerCase();

    if (key === 'r') return void replay();
    if (key === 'h') return void (panel.hidden = !panel.hidden);
    if (key === 'c') return void (grid.hidden = !grid.hidden);
    if (key === 'g') return void openGSDevTools();

    if (key === 's') {
      slowMotion = !slowMotion;
      scale = slowMotion ? 0.25 : 1;
      return applyScale();
    }

    const scene = SCENE_KEYS.find(([shortcut]) => shortcut === key);
    if (scene) seekScene(scene[1]);
  });

  // Reflete o estado a cada execucao sem custo de polling continuo.
  const interval = setInterval(refresh, 400);
  window.addEventListener('beforeunload', () => clearInterval(interval));

  if (initialScene) {
    const wait = setInterval(() => {
      if (!preloader.timeline) return;
      clearInterval(wait);
      seekScene(initialScene);
    }, 60);
  }

  applyScale();

  // Superficie de inspecao no console.
  window.__teze = { preloader, router, gsap, replay, seekScene };
  console.info(
    '%cTezê · direcao de arte',
    'color:#A8202A;font-weight:700',
    '\nR repetir · 1-8 cena · S lento · G gsdevtools · C grade · H painel',
    '\nwindow.__teze para inspecionar',
  );
}
