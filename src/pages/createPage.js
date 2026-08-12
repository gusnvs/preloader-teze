/**
 * Fabrica das paginas de demonstracao.
 *
 * As paginas sao propositalmente vazias. O objeto deste laboratorio e a
 * transicao entre elas — qualquer conteudo aqui competiria com o que
 * realmente precisa ser avaliado.
 */

import { el } from '../utils/dom.js';

/**
 * @param {{ id: string, eyebrow: string, title: string, action: { label: string, to: string }, note?: string }} spec
 * @returns {() => HTMLElement}
 */
export function createPage(spec) {
  return () =>
    // `is-entering` e removida pela cena 8. Ver a nota la sobre por que a
    // revelacao da pagina e declarativa em vez de um tween.
    el('section', { class: 'page is-entering', 'data-page': spec.id }, [
      el('div', { class: 'page__inner' }, [
        el('p', { class: 'page__eyebrow', text: spec.eyebrow }),
        el('h1', { class: 'page__title', html: spec.title }),
        el(
          'button',
          {
            class: 'page__action',
            type: 'button',
            'data-link': spec.action.to,
          },
          [
            el('span', { text: spec.action.label }),
            el('span', { class: 'page__action-arrow', 'aria-hidden': 'true', text: '→' }),
          ],
        ),
      ]),
      spec.note ? el('p', { class: 'page__note', text: spec.note }) : null,
    ]);
}
