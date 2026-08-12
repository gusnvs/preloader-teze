/**
 * VARIANTE DE MOVIMENTO REDUZIDO
 *
 * Quando o sistema pede `prefers-reduced-motion: reduce`, a resposta certa
 * nao e a mesma animacao mais devagar — deslocamento continua sendo
 * deslocamento. Aqui a historia e contada so com tempo e opacidade: a
 * colagem se revela, permanece, se recolhe.
 *
 * Nenhuma peca se move, gira ou muda de escala durante a animacao. As
 * pegadas ainda aparecem em sequencia — o rastro e narrativa, nao enfeite,
 * e continua legivel sem nenhum deslocamento.
 */

import { gsap } from 'gsap';

export function createTimelineReduzida({ refs, pieces, prints, motion, getPage, onCommit }) {
  const innerNodes = pieces.map((piece) => piece.inner);
  const printNodes = prints.map((print) => print.node);

  // Estado inicial: tudo ja no lugar definitivo, apenas invisivel.
  pieces.forEach((piece) => {
    gsap.set(piece.inner, { rotation: piece.data.rot, x: 0, y: 0, scale: 1, opacity: 0 });
    gsap.set(piece.media, { rotation: 0, x: 0, y: 0, scale: 1 });
  });
  gsap.set(printNodes, { opacity: 0 });
  gsap.set(refs.container, { opacity: 0 });

  const tl = gsap.timeline();

  tl.to(refs.container, { opacity: 1, duration: motion.fadeIn, ease: 'none' }, 0)
    .to(innerNodes, { opacity: 1, duration: motion.fadeIn, stagger: motion.stagger, ease: 'none' }, 0)
    .to(
      printNodes,
      { opacity: 0.9, duration: motion.fadeIn * 0.5, stagger: motion.stagger * 2.5, ease: 'none' },
      motion.fadeIn * 0.55,
    );

  // A troca de conteudo acontece com a tela coberta, igual a versao completa.
  tl.addLabel(motion.commitLabel).call(() => onCommit?.());

  tl.to({}, { duration: motion.hold });

  tl.to(
    [...printNodes, ...innerNodes],
    { opacity: 0, duration: motion.fadeOut, stagger: motion.stagger, ease: 'none' },
  ).to(refs.container, { opacity: 0, duration: motion.fadeOut, ease: 'none' }, '<');

  // Mesma escolha da cena 8: a revelacao da pagina e uma classe, nao um
  // tween — a pagina nasce depois que esta timeline foi construida.
  tl.add(() => {
    getPage()?.classList.remove('is-entering');
  }, `-=${motion.fadeOut * 0.75}`);

  return tl;
}
