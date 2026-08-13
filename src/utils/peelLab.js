/**
 * LABORATORIO DA FIGURINHA (apenas em `npm run dev`)
 *
 * Uma figurinha, grande, sobre papel, com um controle de progresso na mao.
 * Existe por um motivo so: a colagem e um efeito de fisica, e fisica se
 * julga parando o movimento e olhando de perto — nao assistindo a animacao
 * inteira dez vezes.
 *
 *   ?lab=peel                abre o laboratorio
 *   ?lab=peel&art=oh-la-la   escolhe a arte
 *
 * Atalhos: espaco toca/pausa, setas andam quadro a quadro, D troca a borda
 * de colagem, G alterna a grade das faixas.
 */

import { gsap } from 'gsap';
import { createPeelSticker, FAIXAS_POR_NIVEL } from '../components/PeelSticker.js';
import { registerEases } from '../animations/eases.js';
import { getAsset } from './assets.js';
import { resolveTier } from './deviceTier.js';

const ARTES = ['mascote', 'quadro-teze', 'quadro-mascote', 'madame-zaze', 'oh-la-la', 'mascote-boina'];
const BORDAS = ['top', 'bottom', 'left', 'right'];

const ESTILO = `
.tz-lab {
  position: fixed; inset: 0; z-index: 900;
  display: grid; grid-template-rows: 1fr auto; gap: 0;
  background:
    radial-gradient(120% 90% at 50% 40%, var(--tz-paper-bright), var(--tz-paper) 58%, var(--tz-paper-warm));
}
.tz-lab__palco { display: grid; place-items: center; padding: 4vmin; }
.tz-lab__peca { width: min(46vmin, 60vw); }
.tz-lab__tira { display: flex; align-items: center; justify-content: center; gap: 2vw; width: 100%; }
.tz-lab__quadro { flex: 1 1 0; max-width: 15vw; }
.tz-lab__quadro span {
  display: block; margin-top: 10px; text-align: center; color: #4a453e;
  font: 10px 'Courier Prime', monospace; letter-spacing: .1em;
}
.tz-lab__peca[data-grade] .tz-peel__band { outline: 1px solid rgba(146,25,21,.5); }
.tz-lab__painel {
  display: flex; align-items: center; gap: 18px; flex-wrap: wrap;
  padding: 14px 20px; background: rgba(20,18,16,.9); color: #f4eddf;
  font: 11px/1.6 'Courier Prime', ui-monospace, monospace;
  letter-spacing: .08em;
}
.tz-lab__painel b { color: #b58526; font-weight: 400; }
.tz-lab__painel input[type=range] { width: min(46vw, 420px); accent-color: #921915; }
.tz-lab__painel button {
  color: inherit; border: 1px solid rgba(244,237,223,.28); padding: 5px 12px;
  font: inherit; letter-spacing: .12em; text-transform: uppercase; cursor: pointer;
}
.tz-lab__painel button:hover { background: rgba(244,237,223,.12); }
`;

export function mountPeelLab() {
  registerEases();

  const params = new URLSearchParams(location.search);
  const arte = params.get('art') && ARTES.includes(params.get('art')) ? params.get('art') : ARTES[0];

  const asset = getAsset(arte);
  if (!asset?.src) {
    console.warn(`[lab] arte desconhecida: ${arte}. Disponiveis:`, ARTES);
    return;
  }

  document.body.appendChild(
    Object.assign(document.createElement('style'), { textContent: ESTILO }),
  );

  const raiz = document.createElement('div');
  raiz.className = 'tz-lab';
  raiz.innerHTML = `
    <div class="tz-lab__palco"><div class="tz-lab__peca"></div></div>
    <div class="tz-lab__painel">
      <span>arte <b data-arte></b></span>
      <span>borda <b data-borda></b></span>
      <span>faixas <b data-faixas></b></span>
      <input type="range" min="0" max="1000" value="0" data-progresso>
      <span>p = <b data-valor>0.000</b></span>
      <button data-tocar>tocar</button>
      <button data-borda-troca>borda</button>
      <button data-grade>grade</button>
    </div>`;
  document.body.appendChild(raiz);

  const palco = raiz.querySelector('.tz-lab__peca');
  const barra = raiz.querySelector('[data-progresso]');
  const valorEl = raiz.querySelector('[data-valor]');

  const slices = FAIXAS_POR_NIVEL[resolveTier()] ?? FAIXAS_POR_NIVEL.alta;
  let bordaIndex = Math.max(BORDAS.indexOf(params.get('dir')), 0);
  let peel = null;
  let tween = null;

  // A proporcao da arte so existe depois que a imagem carrega — e ela e que
  // reserva a altura da caixa. Uma medida, uma vez.
  const sonda = new Image();
  sonda.src = asset.src;

  function montar() {
    tween?.kill();
    peel?.destroy();

    peel = createPeelSticker({
      src: asset.src,
      ratio: sonda.naturalWidth / sonda.naturalHeight,
      direction: BORDAS[bordaIndex],
      slices,
    });

    palco.appendChild(peel.node);
    peel.node.dataset.peeling = '';
    peel.measure();
    aplicar(Number(barra.value) / 1000);

    raiz.querySelector('[data-arte]').textContent = arte;
    raiz.querySelector('[data-borda]').textContent = BORDAS[bordaIndex];
    raiz.querySelector('[data-faixas]').textContent = String(slices);
  }

  function aplicar(p) {
    peel.progress = p;
    valorEl.textContent = p.toFixed(3);
  }

  /**
   * A TIRA — a mesma figurinha em seis progressos, lado a lado.
   *
   * Julgar a progressao vendo a animacao rodar e impossivel: o olho nao
   * guarda o quadro anterior. Lado a lado, um estado que nao pertence a
   * sequencia salta na hora.
   */
  function montarTira() {
    palco.className = 'tz-lab__tira';
    palco.replaceChildren();

    [0, 0.2, 0.4, 0.6, 0.8, 1].forEach((p) => {
      const quadro = document.createElement('div');
      quadro.className = 'tz-lab__quadro';

      const peca = createPeelSticker({
        src: asset.src,
        ratio: sonda.naturalWidth / sonda.naturalHeight,
        direction: BORDAS[bordaIndex],
        slices,
      });

      quadro.append(peca.node, Object.assign(document.createElement('span'), { textContent: p.toFixed(1) }));
      palco.appendChild(quadro);
      peca.measure();
      peca.progress = p;
    });
  }

  const tira = params.get('strip') === '1';
  sonda
    .decode()
    .then(tira ? montarTira : montar)
    .catch(tira ? montarTira : montar);

  barra.addEventListener('input', () => {
    if (!peel) return;
    tween?.kill();
    aplicar(Number(barra.value) / 1000);
  });

  const tocar = () => {
    tween?.kill();
    peel.progress = 0;
    barra.value = '0';
    tween = gsap.to(peel, {
      progress: 1,
      duration: 1.15,
      ease: 'tz.press',
      onUpdate: () => {
        barra.value = String(Math.round(peel.progress * 1000));
        valorEl.textContent = peel.progress.toFixed(3);
      },
    });
  };

  raiz.querySelector('[data-tocar]').addEventListener('click', tocar);
  raiz.querySelector('[data-borda-troca]').addEventListener('click', () => {
    bordaIndex = (bordaIndex + 1) % BORDAS.length;
    montar();
  });
  raiz.querySelector('[data-grade]').addEventListener('click', () => {
    palco.toggleAttribute('data-grade');
  });

  document.addEventListener('keydown', (evento) => {
    if (evento.target.tagName === 'INPUT') return;
    const passo = evento.shiftKey ? 100 : 10;
    if (evento.key === ' ') {
      evento.preventDefault();
      tocar();
    }
    if (evento.key === 'ArrowRight' || evento.key === 'ArrowLeft') {
      tween?.kill();
      const delta = evento.key === 'ArrowRight' ? passo : -passo;
      barra.value = String(Math.min(1000, Math.max(0, Number(barra.value) + delta)));
      aplicar(Number(barra.value) / 1000);
    }
  });

  window.__peel = { get atual() { return peel; }, tocar, montar };
}
