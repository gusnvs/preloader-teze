/**
 * Gramática de entrada compartilhada pelas cenas 1, 2 e 3.
 *
 * As três cenas contam a mesma ação — um adesivo encontra a parede —
 * mudando só a intensidade e o ritmo. Manter o gesto em um lugar só garante
 * que a colagem inteira pareça feita pela mesma mão, e faz qualquer ajuste
 * de direção valer para os três atos de uma vez.
 *
 * O gesto tem duas partes que acontecem juntas:
 *
 *   1. o adesivo SOBE — vem de baixo, de fora do seu lugar;
 *   2. o adesivo COLA — a aba levantada assenta de baixo para cima,
 *      comandada por `--tz-peel` (ver `preloader.css`).
 *
 * A colagem termina um pouco ANTES do movimento parar. É de propósito: o
 * polegar assenta o papel enquanto a mão ainda está acomodando a peça, e
 * inverter essa ordem faz o adesivo parecer um decalque que só apareceu.
 */

import { gsap } from 'gsap';

/** Vetor de origem por sabor de entrada, em unidades de composição. */
const ORIGIN = {
  up: (d) => ({ x: 0, y: -d }),
  down: (d) => ({ x: 0, y: d }),
  left: (d) => ({ x: -d * 1.6, y: -d * 0.35 }),
  right: (d) => ({ x: d * 1.6, y: -d * 0.35 }),
  settle: (d) => ({ x: 0, y: -d * 0.35 }),
};

/**
 * Constrói a entrada de uma peça.
 *
 * @param {object} piece  peça criada por `createCollagePiece`
 * @param {object} cfg    bloco de configuração da cena (awaken/gather/mural)
 * @param {object} stage  medidas congeladas do palco
 * @returns {gsap.core.Timeline}
 */
export function entranceFrom(piece, cfg, stage) {
  const { data, inner, media, sticker, node } = piece;
  const { variation } = data;

  const distance = cfg.riseDistance * variation.windJitter;
  const origin = (ORIGIN[data.from] ?? ORIGIN.settle)(distance);

  // Viés de subida: mesmo as peças que entram pelos lados chegam DE BAIXO.
  // Sem isto a colagem não "enche", ela pisca — metade das peças descendo
  // do topo cancela a leitura de maré que a cena inteira depende.
  origin.y += distance * (cfg.riseBias ?? 0);

  // A peça chega girada além do ângulo final e "assenta" nele — o papel
  // encontra o lugar, não aparece nele.
  const rotationFrom =
    data.rot + cfg.rotationOffset * variation.rotOffsetSign + variation.rotJitter;

  const tl = gsap.timeline();

  tl.fromTo(
    inner,
    {
      x: stage.u(origin.x),
      y: stage.u(origin.y),
      rotation: rotationFrom,
      scale: cfg.scaleFrom,
      opacity: 0,
    },
    {
      x: 0,
      y: 0,
      rotation: data.rot,
      scale: 1,
      opacity: 1,
      duration: cfg.duration,
      ease: cfg.ease,
      force3D: true,
    },
    0,
  );

  // A opacidade resolve antes do movimento: papel não aparece aos poucos
  // enquanto voa, ele já está lá e vai se acomodando.
  tl.to(inner, { opacity: 1, duration: cfg.duration * 0.3, ease: 'tz.veil' }, 0);

  // Camada de reação zerada e explícita — a cena 5 conta com ela limpa.
  tl.set(media, { rotation: 0, y: 0, scale: 1 }, 0);

  // --- A colagem ---------------------------------------------------------
  if (sticker && cfg.peel) {
    const peelFrom = cfg.peel.from * variation.windJitter;

    // `attr: { ...: null }` do GSAP não REMOVE o atributo — e um
    // `data-peeled` sobrevivente da execução anterior deixa a aba com
    // `display: none` antes mesmo de ela ter chance de aparecer.
    tl.call(() => node.removeAttribute('data-peeled'), null, 0);

    tl.fromTo(
      sticker,
      { '--tz-peel': Math.min(peelFrom, 0.95) },
      {
        '--tz-peel': 0,
        duration: cfg.duration * cfg.peel.durationRatio,
        ease: cfg.peel.ease,
      },
      cfg.duration * cfg.peel.delayRatio,
    );

    // Colado: a aba sai da árvore de pintura. Sem isto, uma centena de
    // filtros de escala de cinza continuaria custando depois da cena.
    tl.set(node, { attr: { 'data-peeled': '' } }, cfg.duration * 1.02);
  }

  return tl;
}
