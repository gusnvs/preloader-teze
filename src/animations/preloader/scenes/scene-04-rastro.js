/**
 * CENA 4 — RASTRO
 *
 * A pata atravessa a cena sem nunca ser vista. Cada pegada e um carimbo:
 * chega grande demais, bate no papel, recua 3% e para. E a batida — e o
 * som que ela sugere — que cria a presenca do animal.
 *
 * A tinta seca atras dela: cada pegada comeca a sumir alguns passos depois
 * de nascer. O rastro nunca esta inteiro na tela, e por isso ele *anda*.
 *
 * Devolve tambem `landings` — o instante e o lugar de cada batida. A cena 5
 * usa essa lista para sincronizar a reacao do mural, sem que uma cena
 * precise conhecer a implementacao da outra.
 */

import { gsap } from 'gsap';

export function createSceneRastro({ prints, motion }) {
  const cfg = motion.footsteps;
  const tl = gsap.timeline();

  /** @type {Array<{ time: number, x: number, y: number, index: number }>} */
  const landings = [];

  prints.forEach((print, index) => {
    const at = index * cfg.stagger;
    landings.push({ time: at, x: print.x, y: print.y, index });

    // A tinta aparece quase instantaneamente: carimbo nao tem fade-in.
    tl.fromTo(
      print.node,
      { opacity: 0 },
      { opacity: cfg.opacity, duration: cfg.pressDuration * 0.28, ease: 'none' },
      at,
    );

    // A batida.
    tl.fromTo(
      print.media,
      { scale: cfg.scaleFrom },
      { scale: 1, duration: cfg.pressDuration, ease: cfg.ease, force3D: true },
      at,
    );

    // A secagem — comeca `fadeAfter` passos depois desta pegada.
    tl.to(
      print.node,
      { opacity: 0, duration: cfg.fadeDuration, ease: cfg.fadeEase },
      at + cfg.stagger * cfg.fadeAfter,
    );
  });

  return { timeline: tl, landings };
}
