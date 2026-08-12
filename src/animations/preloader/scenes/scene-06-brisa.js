/**
 * CENA 6 — BRISA
 *
 * Antes de qualquer papel sair do lugar, o ar muda. As pecas levantam uma
 * fracao, inclinam na direcao do vento e crescem 3% — o suficiente para o
 * olho entender que elas descolaram da superficie, e cedo demais para
 * entender o que vai acontecer.
 *
 * A ordem importa: o vento entra por um lado e varre o mural. O `stagger`
 * e calculado pela projecao da posicao de cada peca no vetor do vento, e
 * nao pela ordem em que elas aparecem no arquivo de composicao.
 *
 * Esta cena opera na camada `media`; a cena 7 opera na `inner`. Por isso as
 * duas podem se sobrepor sem que uma cancele a outra.
 */

import { gsap } from 'gsap';
import { degToRad } from '../../../utils/math.js';

export function createSceneBrisa({ pieces, refs, motion, stage }) {
  const cfg = motion.breeze;
  const tl = gsap.timeline();

  const wind = degToRad(cfg.angle);
  const windX = Math.cos(wind);
  const windY = Math.sin(wind);

  // Projeta cada peca no eixo do vento: quem esta a barlavento sente antes.
  const projected = pieces
    .map((piece) => ({
      piece,
      reach: piece.data.x * windX + piece.data.y * windY,
    }))
    .sort((a, b) => a.reach - b.reach);

  projected.forEach(({ piece }, index) => {
    const { variation, windBias = 1 } = piece.data;
    const eagerness = windBias * variation.windJitter;

    tl.to(
      piece.media,
      {
        y: -stage.u(cfg.lift * eagerness),
        rotation: cfg.tilt * eagerness * variation.rotOffsetSign,
        scale: 1 + (cfg.scale - 1) * eagerness,
        duration: cfg.duration,
        ease: cfg.ease,
        force3D: true,
      },
      index * cfg.stagger,
    );
  });

  // A assinatura se retira antes do mural: ela nao voa, ela sai de cena.
  tl.to(
    refs.mark,
    { opacity: 0, duration: motion.mark.outDuration, ease: 'tz.veil' },
    projected.length * cfg.stagger * 0.4,
  );

  return tl;
}
