/**
 * Adesivo sendo colado.
 *
 * Referência: o efeito de peel do cravburgers.shop. A ideia é simples e a
 * execução tem uma só sutileza — **a arte é desenhada duas vezes**:
 *
 *   main  o trecho já colado, recortado de cima para baixo
 *   flap  o trecho ainda solto: a MESMA arte, espelhada exatamente sobre a
 *         linha da dobra e achatada para cinza, porque o que se enxerga de
 *         uma aba levantada é o verso do papel, não a estampa
 *
 * A geometria inteira sai de uma variável, `--tz-peel` (1 = solto,
 * 0 = colado), lida pelo CSS em três lugares: os dois recortes e a origem
 * do espelhamento. Animar UM número move a dobra e faz a aba encolher até
 * sumir — não há estado intermediário para sincronizar.
 *
 * A original usa filtros SVG (`feSpecularLighting`) para o brilho do vinil.
 * Aqui não: com mais de cem adesivos em cena, cem filtros de iluminação
 * custariam a animação inteira. O verso sai de um `filter` estático de CSS,
 * que o navegador resolve uma vez e depois só compõe.
 */

import { el } from '../utils/dom.js';
import { createAssetNode } from '../utils/assets.js';

/**
 * Embrulha a arte na estrutura de adesivo.
 *
 * @param {string} assetKey  chave no registro de assets
 * @param {Node} frontNode   a arte já construída (reaproveitada como `main`)
 * @returns {HTMLElement}
 */
export function createStickerNode(assetKey, frontNode) {
  // A aba precisa de uma segunda instância da arte: o mesmo nó não pode
  // estar em dois lugares do DOM.
  const backNode = createAssetNode(assetKey, '');

  const main = el('div', { class: 'tz-sticker__main' }, [frontNode]);

  // Sem segunda cópia disponível o adesivo simplesmente não descola —
  // continua sendo uma peça válida da colagem.
  if (!backNode) return main;

  const flap = el('div', { class: 'tz-sticker__flap', 'aria-hidden': 'true' }, [backNode]);

  return el('div', { class: 'tz-sticker' }, [main, flap]);
}
