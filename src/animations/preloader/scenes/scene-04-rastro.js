/**
 * CENA 4 — RASTRO
 *
 * Duas patas atravessam a cena sem nunca serem vistas. Cada pegada e um
 * adesivo sendo posto: chega um pouco grande, encosta, recua e para. E a
 * batida — e o silencio entre uma e outra — que cria a presenca do animal.
 *
 * A segunda trilha comeca quase um segundo depois da primeira. O intervalo e
 * o que separa "duas patas" de "uma pata com o dobro de pegadas": tempo de
 * ler a primeira como um caminho antes de a segunda existir.
 *
 * A tinta seca atras delas: cada pegada comeca a sumir alguns passos depois
 * de nascer. O rastro nunca esta inteiro na tela, e por isso ele *anda*.
 *
 * Devolve tambem `landings` — o instante e o lugar de cada batida. A cena 5
 * usa essa lista para sincronizar a reacao do mural, sem que uma cena precise
 * conhecer a implementacao da outra.
 */

import { gsap } from 'gsap';

export function createSceneRastro({ prints, motion }) {
  const cfg = motion.footsteps;
  const tl = gsap.timeline();

  /** @type {Array<{ time: number, x: number, y: number, index: number }>} */
  const landings = [];

  prints.forEach((print) => {
    // O instante do passo: o atraso da trilha mais a cadencia dentro dela.
    // Contar pela posicao DENTRO da trilha (e nao pela ordem na lista) e o
    // que permite as duas caminharem ao mesmo tempo, cada uma no seu passo.
    const at = print.delay + print.index * cfg.stagger;
    landings.push({ time: at, x: print.x, y: print.y, index: print.index });

    // A pegada aparece quase instantaneamente: adesivo posto nao tem fade-in.
    tl.fromTo(
      print.node,
      { opacity: 0 },
      { opacity: cfg.opacity, duration: cfg.pressDuration * 0.3, ease: 'none' },
      at,
    );

    // A batida.
    tl.fromTo(
      print.media,
      { scale: cfg.scaleFrom },
      { scale: 1, duration: cfg.pressDuration, ease: cfg.ease, force3D: true },
      at,
    );

    // A secagem — comeca `fadeAfter` passos depois desta pegada. A ultima de
    // cada trilha espera um pouco mais: e a que fecha o caminho, e sumir no
    // mesmo ritmo das outras cortaria a frase no meio.
    const espera = cfg.stagger * (print.last ? cfg.fadeAfter + 1 : cfg.fadeAfter);
    tl.to(
      print.node,
      { opacity: 0, duration: cfg.fadeDuration, ease: cfg.fadeEase },
      at + espera,
    );
  });

  return { timeline: tl, landings };
}
