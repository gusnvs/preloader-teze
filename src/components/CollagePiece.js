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
 */

import { el, setVars } from '../utils/dom.js';
import { createAssetNode } from '../utils/assets.js';
import { createStickerNode } from './StickerPeel.js';
import { createJitter } from '../utils/math.js';

const LAYER_Z = { back: 10, mid: 30, front: 50 };

/** Largura mínima (em `--tz-unit`) para uma peça valer o efeito de colagem. */
const PEEL_MIN_WIDTH = 14;

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
 * @param {{ portrait: boolean, index: number }} context
 * @returns {null | { id, node, inner, media, data }}
 */
export function createCollagePiece(entry, { portrait, index }) {
  if (portrait && entry.hidePortrait) return null;

  const media = createAssetNode(entry.asset, '');
  if (!media) {
    if (import.meta.env.DEV) {
      console.warn(`[colagem] asset ausente: "${entry.asset}" (peca "${entry.id}") — ignorada`);
    }
    return null;
  }

  const geometry = resolveGeometry(entry, portrait);
  const jitter = createJitter(entry.id);

  // Duas condições para uma peça descolar como adesivo:
  //
  //  · ser recortada. Os desenhos a tinta entram em `multiply`: estão
  //    impressos NO papel, não colados SOBRE ele, e não têm verso.
  //
  //  · ser grande o bastante para o gesto aparecer. Abaixo de ~14 unidades
  //    a aba tem poucos pixels e ninguém a enxerga — mas ela custa um
  //    `filter`, uma camada de composição e um `clip-path` animado, exatamente
  //    o mesmo que custa em um adesivo grande. É o pior negócio possível.
  const peels = !entry.blend && !entry.noPeel && geometry.w >= PEEL_MIN_WIDTH;
  const stickerNode = peels ? createStickerNode(entry.asset, media) : null;

  const mediaNode = el('div', { class: 'tz-piece__media' }, [stickerNode ?? media]);
  const innerNode = el('div', { class: 'tz-piece__inner' }, [mediaNode]);

  const node = el(
    'figure',
    {
      class: 'tz-piece',
      'data-piece': entry.id,
      'data-act': entry.act,
      'data-layer': entry.layer ?? 'mid',
      'data-blend': entry.blend ? 'multiply' : null,
      'data-tint': entry.tint ?? null,
      'data-fill': entry.isFill ? '' : null,
      'data-peel': peels ? '' : null,
      'aria-hidden': 'true',
    },
    [innerNode],
  );

  setVars(node, {
    '--tz-x': geometry.x,
    '--tz-y': geometry.y,
    '--tz-w': geometry.w,
    // z-index explícito (camada de preenchimento) ou base da camada mais o
    // desempate estável pela ordem de declaração.
    '--tz-depth': entry.depth ?? (LAYER_Z[entry.layer] ?? LAYER_Z.mid) + index,
  });

  return {
    id: entry.id,
    node,
    inner: innerNode,
    media: mediaNode,
    // Alvo do tween de colagem. `null` nas peças de tinta, que não descolam.
    sticker: stickerNode?.classList.contains('tz-sticker') ? stickerNode : null,
    /**
     * Geometria de projeto, imutável.
     *
     * A simulação da cena 3 escreve em `data.x/y/rot` a posição em que a
     * peça REALMENTE parou — as cenas 5 e 6 precisam disso. Sem uma cópia
     * intocada para restaurar, cada execução partiria do resultado da
     * anterior e a colagem giraria um pouco mais a cada navegação, até virar
     * de cabeça para baixo.
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
