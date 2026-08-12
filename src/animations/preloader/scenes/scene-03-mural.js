/**
 * CENA 3 — A CHUVA (a tela lota)
 *
 * A cena que não é feita de tweens. Os adesivos caem do topo, colidem e
 * empilham até cobrir a tela — a densidade não é projetada, ela emerge das
 * colisões. O motivo e as decisões estão em `physics/stickerDrop.js`.
 *
 * O que este arquivo resolve é o encaixe entre uma simulação (que corre em
 * tempo real) e uma timeline (que precisa ser posicionável e escalável):
 *
 *   · a física NÃO é ligada ao relógio da máquina. Um tween vazio de duração
 *     conhecida serve de régua, e a cada `onUpdate` a simulação é avançada
 *     até o tempo que o progresso do tween indica, em passos fixos. Assim
 *     `timeScale` continua valendo e o resultado não muda com o FPS;
 *
 *   · ao terminar, a pilha é ENTREGUE ao GSAP: cada peça recebe a posição em
 *     que parou e as cenas seguintes seguem sem saber que houve física.
 *
 * O sopro coletivo do fim continua: um assentamento de 1,2% que costura
 * cento e tantas peças independentes em um único objeto.
 */

import { gsap } from 'gsap';
import { createStickerDrop } from '../physics/stickerDrop.js';

export function createSceneMural(ctx) {
  const { pieces, refs, motion, stage } = ctx;
  const cfg = motion.mural;
  const tl = gsap.timeline();

  const elenco = pieces.filter((piece) => piece.data.act === 3);
  if (!elenco.length) return tl;

  // As peças já nascem invisíveis pelo `resetStage` do orquestrador, e a
  // simulação as revela uma a uma ao soltar cada corpo. Um `set` de opacidade
  // aqui na timeline seria contraproducente: ele fica na posição 0 e se
  // reafirma a cada render, apagando a escrita direta da física.
  const queda = createStickerDrop({ pieces: elenco, stage, cfg: cfg.drop });
  ctx.queda = queda;

  tl.to(
    { progresso: 0 },
    {
      progresso: 1,
      duration: cfg.drop.duration,
      ease: 'none',
      onUpdate() {
        queda.avancarPara(this.progress() * cfg.drop.simDuration);
      },
      onComplete() {
        queda.entregar(gsap);
      },
      // Voltar no tempo (scrub das ferramentas de direção) não desfaz uma
      // simulação: o jeito honesto é remontá-la do zero.
      onReverseComplete() {
        queda.entregar(gsap);
      },
    },
    0,
  );

  // O sopro coletivo, já com a pilha formada. Uma transformação, não cento e
  // tantas — é o que faz o conjunto virar um objeto só.
  tl.fromTo(
    refs.mural,
    { scale: cfg.settleScale },
    { scale: 1, duration: cfg.settleDuration, ease: 'tz.settle', force3D: true },
    cfg.drop.duration * 0.82,
  );

  return tl;
}
