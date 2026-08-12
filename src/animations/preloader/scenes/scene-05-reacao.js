/**
 * CENA 5 — REACAO
 *
 * O detalhe que transforma o rastro em acontecimento: o mural sente a
 * passagem. Cada peca proxima de uma pegada estremece — inclina para o lado
 * oposto ao passo, levanta um fio e volta, com o tremor amortecido de papel
 * leve (`tz.flutter`).
 *
 * A intensidade cai com a distancia e e modulada pelo `reactive` de cada
 * peca: uma fita colada nao se mexe como um recibo solto. Nada disso e
 * calculado em tempo de animacao — a proximidade e resolvida aqui, na
 * construcao da timeline, e vira tweens comuns.
 */

import { gsap } from 'gsap';

export function createSceneReacao({ pieces, motion, stage }, landings) {
  const cfg = motion.reaction;
  const tl = gsap.timeline();

  if (!landings.length) return tl;

  // Evita empilhar duas reacoes na mesma peca em um intervalo curto: o
  // papel responderia mais rapido do que consegue voltar ao lugar.
  const lastReactionAt = new Map();

  landings.forEach((landing) => {
    pieces.forEach((piece) => {
      const sensitivity = piece.data.reactive ?? 0;
      if (sensitivity <= 0) return;

      const gap = Math.hypot(piece.data.x - landing.x, piece.data.y - landing.y);
      if (gap > cfg.radius) return;

      const falloff = 1 - gap / cfg.radius;
      const strength = falloff * falloff * sensitivity; // queda quadratica
      if (strength < 0.12) return;

      const previous = lastReactionAt.get(piece.id);
      if (previous != null && landing.time - previous < cfg.duration * 0.55) return;
      lastReactionAt.set(piece.id, landing.time);

      // A peca se afasta do ponto do impacto.
      const direction = piece.data.x < landing.x ? -1 : 1;
      const tilt = cfg.maxTilt * strength * direction;
      const lift = stage.u(cfg.maxLift * strength);

      const at = landing.time + cfg.delay;

      // `fromTo` com destino zerado: o impacto acontece no primeiro quadro
      // e o tremor decai ate o repouso. O GSAP aplica os valores finais
      // exatos ao concluir, entao a peca volta a zero mesmo com uma curva
      // que oscila — sem precisar de nenhuma limpeza depois.
      //
      // (Um `set` de seguranca aqui seria um erro: as ultimas reacoes ainda
      // estao decaindo quando a cena 6 comeca, e o `set` arrancaria a peca
      // de volta ao zero no meio do vento.)
      tl.fromTo(
        piece.media,
        { rotation: tilt, y: -lift },
        {
          rotation: 0,
          y: 0,
          duration: cfg.duration,
          ease: cfg.ease,
          force3D: true,
        },
        at,
      );
    });
  });

  return tl;
}
