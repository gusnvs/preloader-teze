/**
 * Monta o DOM do pre-loader.
 *
 * Construido uma unica vez e reaproveitado em todas as transicoes. Recriar
 * trinta nos e decodificar as imagens a cada navegacao custaria os
 * primeiros quadros — justamente onde a animacao precisa ser impecavel.
 *
 * O que muda entre execucoes: quais pecas raras entram em cena.
 */

import { el } from '../utils/dom.js';
import { paperTextureUrl } from '../utils/assets.js';
import { createCollagePiece } from './CollagePiece.js';
import { createFootprintTrail } from './FootprintTrail.js';
import { generateFillPieces } from './FillLayer.js';
import { COLLAGE, TRAIL, FILL } from '../config/collage.config.js';
import { isPortrait } from '../utils/viewport.js';
import { resolveTier } from '../utils/deviceTier.js';

/** Resolve a configuracao da trilha para a orientacao atual. */
function resolveTrail(portrait) {
  return portrait ? { ...TRAIL, ...TRAIL.portrait } : TRAIL;
}

/**
 * @param {HTMLElement} root  container fixo do pre-loader
 * @param {{ trailSteps: number }} options
 */
export function buildPreloaderStage(root, { trailSteps = 13 } = {}) {
  const portrait = isPortrait();
  const tier = resolveTier();

  const veil = el('div', { class: 'tz-preloader__veil' });
  const grain = el('div', { class: 'tz-preloader__grain' });
  const stage = el('div', { class: 'tz-preloader__stage' });
  const trailLayer = el('div', { class: 'tz-preloader__trail' });
  const noise = el('div', { class: 'tz-preloader__noise' });
  const vignette = el('div', { class: 'tz-preloader__vignette' });

  // A textura pintada entra como custom property: se o asset nao existir,
  // o CSS simplesmente nao desenha nada.
  const texture = paperTextureUrl();
  if (texture) grain.style.setProperty('--tz-grain-src', `url("${texture}")`);

  // --- Pecas -------------------------------------------------------------
  // A camada de preenchimento e montada PRIMEIRO, para ficar no fundo do
  // palco. As pecas narrativas entram por cima e continuam legiveis mesmo
  // com a tela lotada.
  const pieces = [];

  const anexar = (entry, index) => {
    const piece = createCollagePiece(entry, { portrait, index });
    if (!piece) return;
    pieces.push(piece);
    stage.appendChild(piece.node);
  };

  generateFillPieces(FILL, { portrait, tier }).forEach((entry, index) => anexar(entry, index));
  COLLAGE.forEach((entry, index) => anexar(entry, index));

  // --- Pegadas -----------------------------------------------------------
  const { nodes: printNodes, prints } = createFootprintTrail(resolveTrail(portrait), {
    steps: trailSteps,
  });
  printNodes.forEach((node) => trailLayer.appendChild(node));

  // --- Assinatura --------------------------------------------------------
  const rule = el('span', { class: 'tz-preloader__rule' });
  const mark = el('figcaption', { class: 'tz-preloader__mark' }, [
    el('span', { class: 'tz-preloader__mark-word', text: 'Tezê' }),
    rule,
    el('span', { text: 'um instante' }),
  ]);

  // `aria-hidden` + `role=status` separados: a colagem inteira e decorativa,
  // mas o estado de carregamento precisa chegar a leitores de tela.
  const status = el('p', {
    class: 'tz-visually-hidden',
    role: 'status',
    'aria-live': 'polite',
    text: '',
  });

  // Papel, pecas e pegadas dentro do mesmo no: e o que permite as pecas de
  // tinta multiplicarem contra o papel. Ver a nota em `preloader.css`.
  const mural = el('div', { class: 'tz-preloader__mural' }, [veil, grain, stage, trailLayer]);

  const container = el('div', { class: 'tz-preloader', 'aria-hidden': 'true' }, [
    mural,
    noise,
    vignette,
    mark,
  ]);

  root.replaceChildren(container, status);

  return {
    portrait,
    tier,
    refs: { container, mural, veil, grain, stage, trailLayer, noise, vignette, mark, rule, status },
    pieces,
    prints,
  };
}
