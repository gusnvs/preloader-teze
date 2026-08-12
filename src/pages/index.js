/**
 * Mapa de rotas.
 * Duas paginas, um botao em cada — o suficiente para exercitar a transicao
 * nos dois sentidos, inclusive pelo voltar do navegador.
 */

import { createPage } from './createPage.js';

export const ROUTES = {
  '/': createPage({
    id: 'inicio',
    eyebrow: 'Laboratório de transição · 01',
    title: 'Página <em>um</em>',
    action: { label: 'Ir para página 2', to: '/descobertas' },
    note: 'a pata passou por aqui — repare no chão',
  }),

  '/descobertas': createPage({
    id: 'descobertas',
    eyebrow: 'Laboratório de transição · 02',
    title: 'Página <em>dois</em>',
    action: { label: 'Voltar', to: '/' },
    note: 'de vez em quando ela aparece. de vez em quando.',
  }),
};
