/**
 * FIGURINHA QUE COLA — o componente.
 *
 * Uma figurinha de papel adesivo sendo assentada sobre uma superficie: uma
 * parte ja colada, uma dobra viajando, o resto ainda no ar. A conta esta em
 * `animations/peel/peelGeometry.js`; aqui mora so a traducao para o DOM.
 *
 * ─── A TECNICA, E POR QUE ESTA ───────────────────────────────────────────
 *
 * A arte e recortada em N faixas — cada uma um `<div>` com uma JANELA FIXA
 * sobre a mesma imagem (`background-position`) — e cada faixa recebe a
 * rotacao acumulada da sua posicao na curva. Faixas diferentes em estados
 * diferentes ao mesmo tempo e exatamente o efeito procurado; uma unica
 * `rotateX` na imagem inteira seria um cartao rigido girando.
 *
 * Alternativas consideradas e por que nao:
 *
 *   · SVG (mask/clipPath/filtros) — mascara controla QUANTO da arte aparece,
 *     mas nao curva superficie nem produz perspectiva. Serviria para o
 *     "reveal"; nao para a dobra;
 *   · Canvas 2D — controle total do sombreado, mas repinta a figurinha
 *     inteira a cada quadro, em 2x de DPR, na CPU. Aqui sao seis figurinhas
 *     dentro de um pre-loader que ainda vai receber 130 adesivos caindo;
 *   · WebGL — resolveria com malha e shader, e traria Three.js, um contexto
 *     de GPU e um segundo pipeline de render para um efeito de 1,5 s. So se
 *     o CSS nao desse conta. Ele da.
 *
 * O que o CSS 3D entrega e o que interessa: a perspectiva e do navegador (a
 * faixa longe encurta de verdade), a composicao e da GPU, e durante a
 * animacao so mudam `transform`, `filter` e `opacity` — nenhuma pintura,
 * nenhum layout.
 *
 * ─── ESTRUTURA ───────────────────────────────────────────────────────────
 *
 *   .tz-peel                 caixa da figurinha (proporcao da arte)
 *   ├ .tz-peel__cast         a sombra projetada pela parte levantada
 *   ├ .tz-peel__sheet        `perspective` — o "olho" que ve as faixas
 *   │ └ .tz-peel__band × N   uma janela da arte + rotacao propria
 *   │   └ .tz-peel__liner    o verso siliconado, quando a faixa passa do meio-giro
 *   └ .tz-peel__flat         a arte inteira, para depois que assentou
 *
 * Terminada a colagem, `settle()` troca as N faixas por essa unica imagem:
 * o resto da timeline (a chuva, as pegadas, a queda) nao deve pagar por um
 * efeito que ja acabou.
 */

import { el } from '../utils/dom.js';
import { criarFaixas, resolverAncora, resolverCadeia, PADRAO } from '../animations/peel/peelGeometry.js';

/** Quantas faixas por nivel de aparelho. Menos faixas = curva mais facetada. */
export const FAIXAS_POR_NIVEL = { alta: 16, media: 12, baixa: 8 };

/**
 * @param {object} options
 * @param {string} options.src        url da arte (PNG/WebP recortado)
 * @param {number} options.ratio      largura / altura da arte
 * @param {string} [options.direction] borda que encosta primeiro
 * @param {number} [options.slices]
 * @param {number} [options.curl]     angulo do enrolamento no inicio
 * @param {number} [options.curlEnd]  …e no fim
 * @param {number} [options.bend]     concentracao da curvatura na ponta
 * @param {number} [options.depth]    profundidade da perspectiva, em multiplos
 *                                    do eixo da colagem
 * @param {boolean} [options.reduced] versao sem deformacao
 */
export function createPeelSticker(options) {
  const cfg = { ...PADRAO, ...options };
  const ancora = resolverAncora(cfg.direction);
  const vertical = ancora.eixo === 'y';

  const flat = el('img', {
    class: 'tz-peel__flat',
    src: cfg.src,
    alt: '',
    decoding: 'async',
    'aria-hidden': 'true',
  });
  flat.draggable = false;

  const node = el('div', { class: 'tz-peel' }, [flat]);
  node.style.setProperty('--tz-peel-art', `url("${cfg.src}")`);
  node.style.aspectRatio = `${cfg.ratio}`;
  node.dataset.axis = ancora.eixo;

  // Movimento reduzido: a figurinha simplesmente EXISTE. Nem as faixas sao
  // criadas — uma animacao que nao vai rodar nao deve custar dezenas de nos
  // no documento.
  //
  // `data-settled` desde o inicio: e ele que faz a arte inteira aparecer no
  // lugar das faixas (ver `peel.css`). Sem essa linha a peca ficaria
  // invisivel, que e o oposto de "menos movimento".
  //
  // O progresso vira um valor de leitura: quem quiser que a peca apareca
  // devagar anima a opacidade da PECA, e nao a colagem — nao ha colagem.
  if (cfg.reduced) {
    node.dataset.settled = '';
    return {
      node,
      get progress() {
        return 1;
      },
      set progress(_valor) {},
      settle() {},
      reset() {},
      measure() {},
      destroy() {
        node.remove();
      },
    };
  }

  // --- As faixas ----------------------------------------------------------
  const n = cfg.slices;
  const sheet = el('div', { class: 'tz-peel__sheet' });
  const cast = el('div', { class: 'tz-peel__cast' });
  const bandas = [];
  const versos = [];

  // Sangria: a faixa e desenhada um tico maior que a propria banda, e a sobra
  // fica escondida sob a faixa seguinte.
  //
  // Ela existe porque a faixa e rasterizada COM transformacao 3D: a borda da
  // caixa sai suavizada contra o que ha atras, e duas bordas suavizadas
  // encostadas viram um fio claro no meio da arte. Sobrepondo, a borda de
  // baixo de cada faixa fica escondida sob a de cima.
  //
  // O valor e uma fracao da propria faixa, e nao um pixel fixo, porque a
  // figurinha pode ser renderizada em qualquer tamanho — mas precisa ser
  // grande o bastante para valer pelo menos um pixel na MENOR figurinha da
  // composicao (~15 px por faixa). Sobra duplicada nao aparece: e a mesma
  // arte, coberta pela faixa seguinte.
  const SANGRIA = 0.08;
  const banda = 1 / n;
  const caixa = banda + SANGRIA / n;
  // Regra de tres do `background-position` em porcentagem: a posicao p% leva
  // o ponto p% da imagem ao ponto p% da caixa, entao o deslocamento util e
  // (caixa - imagem) — negativo, porque a imagem e maior que a janela.
  const escala = 100 / caixa;
  const posicaoDe = (indice) => (indice * banda * 100) / (1 - caixa);

  for (let i = 0; i < n; i += 1) {
    const arte = ancora.inverte ? n - 1 - i : i;
    const faixa = el('div', { class: 'tz-peel__band' });

    faixa.style.setProperty(
      '--tz-band-size',
      vertical ? `100% ${escala}%` : `${escala}% 100%`,
    );
    faixa.style.setProperty(
      '--tz-band-pos',
      vertical ? `0 ${posicaoDe(arte)}%` : `${posicaoDe(arte)}% 0`,
    );
    faixa.style.transformOrigin = ancora.origem;

    const verso = el('i', { class: 'tz-peel__liner' });
    faixa.appendChild(verso);

    bandas.push(faixa);
    versos.push(verso);
    sheet.appendChild(faixa);
  }

  node.dataset.anchor = ancora.ancora;
  node.style.setProperty('--tz-peel-band', `${caixa * 100}%`);
  node.append(cast, sheet);

  // --- Estado -------------------------------------------------------------
  const faixas = criarFaixas(n);
  let eixoPx = 0;
  let progresso = 0;
  let assentada = false;

  /**
   * Mede o eixo da colagem uma vez. `translateZ` nao aceita porcentagem —
   * a profundidade precisa de pixel, e pixel precisa de layout. Uma leitura
   * por figurinha, fora do laco de animacao.
   */
  function medir() {
    eixoPx = vertical ? sheet.offsetHeight : sheet.offsetWidth;
    sheet.style.perspective = `${Math.max(eixoPx * cfg.depth, 1)}px`;
  }

  function escrever() {
    if (!eixoPx) medir();

    const { contato, altura, ponta } = resolverCadeia(cfg, progresso, faixas);
    const beta = ancora.beta;

    for (let i = 0; i < n; i += 1) {
      const f = faixas[i];
      const a = (f.a * eixoPx).toFixed(2);
      const z = (f.lift * eixoPx).toFixed(2);
      const ang = f.angulo.toFixed(2);

      // O caminho curto (colagem de cima para baixo) evita duas rotacoes de
      // enquadramento por faixa por quadro — e o caso mais comum.
      bandas[i].style.transform =
        beta === 0
          ? `translate3d(0,${a}px,${z}px) rotateX(${ang}deg)`
          : `rotate(${beta}deg) translate3d(0,${a}px,${z}px) rotateX(${ang}deg) rotate(${-beta}deg)`;

      // Filtro so onde ele muda alguma coisa: uma faixa deitada nao precisa
      // virar camada de composicao propria para ficar com brilho 1.
      bandas[i].style.filter = f.angulo > 0.4 ? `brightness(${f.luz.toFixed(3)})` : '';
      versos[i].style.opacity = f.verso === 0 ? '' : `${f.verso.toFixed(3)}`;
    }

    // A SOMBRA.
    //
    // Duas coisas a posicionam, e as duas em coordenadas de TELA — a sombra
    // cai no chao, nao no quadro da figurinha:
    //
    //   · onde esta a dobra, ao longo do eixo da colagem;
    //   · o quanto ela desceu, que e o que faz a sombra sair de baixo da peca
    //     e aparecer. Sombra centrada atras de papel opaco e sombra invisivel.
    const centro = contato + (ponta - contato) * 0.42;
    const alto = Math.min(altura * 2.6, 1);
    const desloca = (centro - 0.5) * eixoPx * (ancora.inverte ? -1 : 1);
    const queda = altura * eixoPx * 0.2;
    const magra = (0.16 + alto * 0.36).toFixed(3);
    const larga = (0.94 + alto * 0.12).toFixed(3);

    cast.style.transform = vertical
      ? `translate3d(0,${(desloca + queda).toFixed(2)}px,0) scale(${larga},${magra})`
      : `translate3d(${desloca.toFixed(2)}px,${queda.toFixed(2)}px,0) scale(${magra},${larga})`;
    cast.style.opacity = (alto * 0.9).toFixed(3);
  }

  return {
    node,

    /**
     * O unico controle: 0 = solta, 1 = colada.
     *
     * E uma propriedade (e nao um metodo) para que o GSAP possa anima-la
     * direto — `gsap.to(peel, { progress: 1 })` — sem proxy nem onUpdate.
     *
     * Escrever um valor menor que 1 DESFAZ o assentamento sozinho. Isso nao e
     * conveniencia: `seek()` do GSAP suprime callbacks por padrao, entao um
     * `reset()` chamado por `tl.call()` simplesmente nao acontece quando a
     * timeline e arrastada — e a figurinha ficaria colada no meio da propria
     * colagem. Depender so da propriedade deixa o efeito correto em qualquer
     * ponto da linha do tempo, tocando ou sendo arrastada.
     */
    get progress() {
      return progresso;
    },
    set progress(valor) {
      progresso = valor < 0 ? 0 : valor > 1 ? 1 : valor;

      if (assentada) {
        if (progresso >= 1) return;
        assentada = false;
        delete node.dataset.settled;
        node.dataset.peeling = '';
      }

      escrever();
    },

    /**
     * Troca as N faixas pela arte inteira.
     *
     * So performance: em `progress = 1` a cadeia ja desenha exatamente a
     * mesma imagem. Se a chamada for perdida (um `seek`, por exemplo), o que
     * se perde e a economia, nao o resultado.
     */
    settle() {
      if (assentada) return;
      assentada = true;
      node.dataset.settled = '';
      delete node.dataset.peeling;
    },

    reset() {
      assentada = false;
      progresso = 0;
      delete node.dataset.settled;
      escrever();
    },

    /** Refazer a medida depois de mudar o tamanho da figurinha. */
    measure() {
      medir();
      if (!assentada) escrever();
    },

    destroy() {
      node.remove();
    },
  };
}
