/**
 * Uma peca de papel do mural.
 *
 * Estrutura de tres camadas — a razao esta em `preloader.css`:
 *
 *   .tz-piece         posicao (CSS estatico)
 *   └ .tz-piece__inner   entrada e saida (GSAP)
 *     └ .tz-piece__media  reacao e respiro (GSAP)
 *
 * Duas timelines podem entao rodar ao mesmo tempo sobre a mesma peca sem
 * disputar a propriedade `transform`.
 *
 * Dentro de `__media` mora ou a arte direto (`<img>`), ou — nas seis pecas
 * dos atos 1 e 2 — uma FIGURINHA QUE COLA, com as suas proprias faixas. A
 * escolha e uma linha na composicao (`peel`), e o resto do projeto nao
 * precisa saber a diferenca: a peca continua tendo `inner`, `media` e
 * geometria.
 */

import { el, setVars } from '../utils/dom.js';
import { createAssetNode, getAsset } from '../utils/assets.js';
import { createPeelSticker, FAIXAS_POR_NIVEL } from './PeelSticker.js';
import { createJitter } from '../utils/math.js';

const LAYER_Z = { back: 10, mid: 30, front: 50 };

/**
 * Aplica a variante de retrato sobre a definicao original.
 * @param {object} entry
 * @param {boolean} portrait
 */
function resolveGeometry(entry, portrait) {
  const override = portrait ? entry.portrait : null;
  return {
    x: override?.x ?? entry.x,
    y: override?.y ?? entry.y,
    w: override?.w ?? entry.w,
    rot: override?.rot ?? entry.rot,
  };
}

/**
 * @param {object} entry item de COLLAGE
 * @param {{ portrait: boolean, index: number, tier?: string, reduced?: boolean }} context
 * @returns {null | { id, node, inner, media, peel, data }}
 */
export function createCollagePiece(entry, { portrait, index, tier = 'alta', reduced = false }) {
  if (portrait && entry.hidePortrait) return null;

  const asset = getAsset(entry.asset);
  if (!asset) {
    if (import.meta.env.DEV) {
      console.warn(`[colagem] asset ausente: "${entry.asset}" (peca "${entry.id}") — ignorada`);
    }
    return null;
  }

  const geometry = resolveGeometry(entry, portrait);
  const jitter = createJitter(entry.id);

  // A figurinha que cola so existe onde a composicao pede. Nao e um efeito
  // que se liga "para todo mundo": cada uma custa uma dezena de faixas, e o
  // gesto so se le quando ha tempo e tamanho para ve-lo.
  const peel = entry.peel
    ? createPeelSticker({
        src: asset.src,
        ratio: asset.ratio,
        direction: entry.peel,
        slices: FAIXAS_POR_NIVEL[tier] ?? FAIXAS_POR_NIVEL.alta,
        reduced,
      })
    : null;

  const mediaNode = el('div', { class: 'tz-piece__media' }, [
    peel ? peel.node : createAssetNode(entry.asset, ''),
  ]);
  const innerNode = el('div', { class: 'tz-piece__inner' }, [mediaNode]);

  const node = el(
    'figure',
    {
      class: 'tz-piece',
      'data-piece': entry.id,
      'data-act': entry.act,
      'data-layer': entry.layer ?? 'mid',
      'data-fill': entry.isFill ? '' : null,
      'data-peel': peel ? '' : null,
      'aria-hidden': 'true',
    },
    [innerNode],
  );

  setVars(node, {
    '--tz-x': geometry.x,
    '--tz-y': geometry.y,
    '--tz-w': geometry.w,
    // z-index explicito (camada de preenchimento) ou base da camada mais o
    // desempate estavel pela ordem de declaracao.
    '--tz-depth': entry.depth ?? (LAYER_Z[entry.layer] ?? LAYER_Z.mid) + index,
  });

  return {
    id: entry.id,
    node,
    inner: innerNode,
    media: mediaNode,
    /** Controle da colagem. `null` nas pecas que apenas caem. */
    peel,
    /**
     * Geometria de projeto, imutavel.
     *
     * A simulacao da cena 3 escreve em `data.x/y/rot` a posicao em que a
     * peca REALMENTE parou — as cenas 5 e 6 precisam disso. Sem uma copia
     * intocada para restaurar, cada execucao partiria do resultado da
     * anterior e a colagem giraria um pouco mais a cada navegacao, ate virar
     * de cabeca para baixo.
     */
    origem: { ...geometry },
    data: {
      ...entry,
      ...geometry,
      /** Cada peca ganha um temperamento proprio, estavel entre execucoes. */
      variation: {
        rotOffsetSign: jitter.chance(0.5) ? 1 : -1,
        rotJitter: jitter.spread(2.4),
        delayJitter: jitter.range(0, 0.09),
        windJitter: jitter.range(0.82, 1.24),
        spinSign: jitter.chance(0.5) ? 1 : -1,
        driftSeed: jitter.range(0, 1),
      },
    },
  };
}
