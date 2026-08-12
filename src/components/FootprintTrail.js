/**
 * A trilha de pegadas.
 *
 * A pata nao aparece — ela ja passou. O que fica na cena e o rastro:
 * pegadas alternando esquerda e direita ao longo de uma curva levemente
 * torta, cada uma orientada pela tangente do caminho e desalinhada por
 * alguns graus, como passo de quem nao anda em linha reta.
 *
 * A geometria e resolvida aqui, na construcao. As cenas recebem posicoes
 * prontas e so cuidam do tempo.
 */

import { el, setVars } from '../utils/dom.js';
import { createAssetNode } from '../utils/assets.js';
import { createJitter, quadraticPoint, quadraticTangent } from '../utils/math.js';

/**
 * @param {object} trail  configuracao TRAIL (ja resolvida para a orientacao)
 * @param {{ steps: number }} options
 * @returns {{ nodes: HTMLElement[], prints: Array<{node, media, x, y, foot}> }}
 */
export function createFootprintTrail(trail, { steps }) {
  const jitter = createJitter('pegadas-teze');
  const prints = [];
  const nodes = [];

  for (let i = 0; i < steps; i += 1) {
    const media = createAssetNode('pegada', '');
    if (!media) break;

    // Progresso ao longo da curva. O leve `easing` na distribuicao evita
    // que os passos fiquem espacados como uma regua.
    const t = steps === 1 ? 0.5 : i / (steps - 1);
    const eased = t + Math.sin(t * Math.PI) * 0.035;

    const point = quadraticPoint(trail.from, trail.control, trail.to, eased);
    const heading = quadraticTangent(trail.from, trail.control, trail.to, eased);

    // Pes alternados: um sai para cada lado da linha de caminhada.
    const foot = i % 2 === 0 ? 'left' : 'right';
    const side = foot === 'left' ? -1 : 1;
    const normal = ((heading + 90) * Math.PI) / 180;
    const offset = trail.stride * 0.5 * side;

    const x = point.x + Math.cos(normal) * offset;
    const y = point.y + Math.sin(normal) * offset;

    const rotation =
      heading + trail.headingOffset + side * (trail.wobble * 0.35) + jitter.spread(trail.wobble);

    const mediaNode = el('div', { class: 'tz-print__media' }, [media]);
    const node = el(
      'div',
      { class: 'tz-print', 'data-foot': foot, 'data-step': i, 'aria-hidden': 'true' },
      [mediaNode],
    );

    setVars(node, {
      '--tz-x': x.toFixed(2),
      '--tz-y': y.toFixed(2),
      '--tz-w': (trail.size * jitter.range(0.9, 1.1)).toFixed(2),
      '--tz-rot': rotation.toFixed(2),
    });

    nodes.push(node);
    prints.push({ node, media: mediaNode, x, y, foot, index: i });
  }

  return { nodes, prints };
}
