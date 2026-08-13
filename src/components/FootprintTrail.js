/**
 * As trilhas de pegadas.
 *
 * A pata nao aparece — ela ja passou. O que fica na cena e o rastro: pegadas
 * alternando esquerda e direita ao longo de uma curva levemente torta, cada
 * uma orientada pela tangente do caminho e desalinhada por alguns graus, como
 * passo de quem nao anda em linha reta.
 *
 * Sao DUAS trilhas, com caminhos e horarios proprios. Cada pegada carrega o
 * `delay` da sua trilha, entao a cena que as anima nao precisa saber que
 * existe mais de um caminho — ela le o instante de cada passo e obedece.
 *
 * A geometria e resolvida aqui, na construcao. As cenas recebem posicoes
 * prontas e so cuidam do tempo.
 */

import { el, setVars } from '../utils/dom.js';
import { createAssetNode } from '../utils/assets.js';
import { createJitter, quadraticPoint, quadraticTangent } from '../utils/math.js';

/**
 * @param {object} trail  configuracao TRAIL (ja resolvida para a orientacao)
 * @param {{ stepScale?: number }} options  fator sobre o numero de passos
 * @returns {{ nodes: HTMLElement[], prints: Array<object> }}
 */
export function createFootprintTrail(trail, { stepScale = 1 } = {}) {
  const jitter = createJitter('pegadas-teze');
  const prints = [];
  const nodes = [];

  trail.paths.forEach((path, indiceTrilha) => {
    const steps = Math.max(Math.round(path.steps * stepScale), 3);

    for (let i = 0; i < steps; i += 1) {
      const media = createAssetNode('pegada', '');
      if (!media) return;

      // Progresso ao longo da curva. O leve `easing` na distribuicao evita
      // que os passos fiquem espacados como uma regua.
      const t = steps === 1 ? 0.5 : i / (steps - 1);
      const eased = t + Math.sin(t * Math.PI) * 0.035;

      const point = quadraticPoint(path.from, path.control, path.to, eased);
      const heading = quadraticTangent(path.from, path.control, path.to, eased);

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
        {
          class: 'tz-print',
          'data-foot': foot,
          'data-step': i,
          'data-trail': path.id ?? indiceTrilha,
          'aria-hidden': 'true',
        },
        [mediaNode],
      );

      setVars(node, {
        '--tz-x': x.toFixed(2),
        '--tz-y': y.toFixed(2),
        '--tz-w': (trail.size * jitter.range(0.92, 1.08)).toFixed(2),
        '--tz-rot': rotation.toFixed(2),
      });

      nodes.push(node);
      prints.push({
        node,
        media: mediaNode,
        x,
        y,
        foot,
        index: i,
        /** Posicao do passo DENTRO da propria trilha, e o atraso dela. */
        trail: indiceTrilha,
        delay: path.delay ?? 0,
        last: i === steps - 1,
      });
    }
  });

  return { nodes, prints };
}
