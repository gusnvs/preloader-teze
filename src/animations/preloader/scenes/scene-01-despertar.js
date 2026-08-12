/**
 * CENA 1 — DESPERTAR
 *
 * Tela limpa. O papel aparece antes de qualquer peca — primeiro existe a
 * superficie, depois o que se cola nela. Tres pecas pousam, com intervalo
 * generoso entre elas. O silencio entre as entradas e parte da cena: e ele
 * que faz o resto parecer acontecer depressa.
 */

import { gsap } from 'gsap';
import { entranceFrom } from './shared/entrance.js';

export function createSceneDespertar({ pieces, refs, motion, stage }) {
  const cfg = motion.awaken;
  const tl = gsap.timeline();
  const cast = pieces.filter((piece) => piece.data.act === 1);

  // O papel: a unica coisa que existe no primeiro segundo.
  tl.fromTo(
    refs.container,
    { opacity: 0 },
    { opacity: 1, duration: cfg.veilDuration, ease: 'tz.veil' },
    0,
  );

  tl.fromTo(
    refs.veil,
    { scale: 1.04 },
    { scale: 1, duration: cfg.veilDuration * 2.2, ease: 'tz.drift' },
    0,
  );

  cast.forEach((piece, index) => {
    tl.add(
      entranceFrom(piece, cfg, stage),
      cfg.veilDuration * 0.55 + index * cfg.stagger + piece.data.variation.delayJitter,
    );
  });

  // A assinatura chega junto com a terceira peca e fica.
  tl.fromTo(
    refs.mark,
    { opacity: 0, y: 8 },
    { opacity: motion.mark.opacity, y: 0, duration: motion.mark.inDuration, ease: 'tz.settle' },
    cfg.veilDuration * 0.55 + cfg.stagger,
  ).fromTo(
    refs.rule,
    { scaleX: 0 },
    { scaleX: 1, duration: cfg.ruleDuration, ease: 'none' },
    cfg.veilDuration * 0.55 + cfg.stagger,
  );

  return tl;
}
