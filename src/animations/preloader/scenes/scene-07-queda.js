/**
 * CENA 7 — A QUEDA
 *
 * A saida tem uma ideia so: a cola cede e tudo desce. Nada parte para os
 * lados, nada desaparece no ar — o quadro se esvazia por baixo, e o que
 * sobra na tela e a pagina nova.
 *
 * A cena e feita de DUAS velocidades, e a diferenca entre elas e a propria
 * revelacao:
 *
 *   O PAPEL vai primeiro. O fundo pintado despenca inteiro, e a borda de
 *   cima dele descendo e o que descobre a pagina.
 *
 *   OS ADESIVOS ficam para tras. Cada um se solta numa onda que corre de cima
 *   para baixo e cai mais devagar (menos massa, mais ar). O resultado e uma
 *   chuva de recortes tombando sobre a pagina ja visivel — que e a unica
 *   parte da transicao que o olho realmente segue.
 *
 * Duas notas de implementacao:
 *
 *   · nao ha `ease`. O `Physics2DPlugin` integra sobre o TEMPO do tween, e
 *     nao sobre a curva — qualquer ease aqui distorceria o relogio da
 *     gravidade em vez do movimento. A aceleracao ja e a curva;
 *
 *   · nao ha fade. Papel some porque saiu do quadro. Cada peca viaja uma
 *     distancia que a poe fora da tela antes do fim do proprio tween.
 */

import { gsap } from 'gsap';
import { Physics2DPlugin } from 'gsap/Physics2DPlugin';
import { clamp } from '../../../utils/math.js';

gsap.registerPlugin(Physics2DPlugin);

/** No `Physics2DPlugin`, 90 graus e para baixo: o eixo y da tela cresce para baixo. */
const ABAIXO = 90;

export function createSceneQueda({ pieces, refs, motion, stage }) {
  const cfg = motion.fall;
  const tl = gsap.timeline();

  // Duas distancias por grupo, e a distincao importa:
  //
  //   REFERENCIA  o percurso que define a VELOCIDADE (`g = 2d/t²`) — a tela
  //               inteira, que e o que o olho mede;
  //   PERCURSO    o quanto o tween realmente anda. Maior, porque a pilha da
  //               cena 3 termina acima do quadro e ninguem sabe quanto: a
  //               posicao real de cada peca so existe DEPOIS da fisica, e
  //               esta timeline e montada antes dela. Andar demais custa
  //               alguns tweens correndo fora do quadro; andar de menos
  //               deixaria uma peca parada no meio da tela.
  const sobra = stage.height * cfg.overshoot;

  /** Gravidade que cobre `distancia` em `segundos`, partindo do repouso. */
  const gravidadeEm = (distancia, segundos) => (2 * distancia) / (segundos * segundos);
  /** Tempo que a mesma gravidade leva para cobrir um percurso maior. */
  const tempoPara = (segundos, referencia, percurso) => segundos * Math.sqrt(percurso / referencia);

  // --- O papel -------------------------------------------------------------
  //
  // O papel e um pouco MAIS ALTO que a tela (ver `--- Fundo de papel` em
  // `preloader.css`): a sobra existe para que a borda de ataque dissolvida
  // comece fora do quadro. Ele so esta fora quando percorreu a propria
  // altura — medida lida do layout, para que o numero nao precise ser
  // repetido aqui.
  const alturaDoPapel = refs.veil.offsetHeight;
  const tempoDoPapel = cfg.duration * cfg.paperRatio;

  tl.to(
    [refs.veil, refs.grain],
    {
      physics2D: {
        velocity: 0,
        angle: ABAIXO,
        gravity: gravidadeEm(alturaDoPapel, tempoDoPapel),
      },
      duration: tempoPara(tempoDoPapel, alturaDoPapel, alturaDoPapel + sobra),
      ease: 'none',
      force3D: true,
    },
    0,
  );

  // --- Os adesivos ---------------------------------------------------------
  const maiorPeca = pieces.reduce((maior, peca) => Math.max(maior, peca.media.offsetHeight), 0);
  const referencia = stage.height + maiorPeca * 0.6;
  const percurso = stage.height + maiorPeca + sobra;
  const gravidade = gravidadeEm(referencia, cfg.duration);
  const travessia = tempoPara(cfg.duration, referencia, percurso);

  pieces.forEach((peca) => {
    if (peca.data.blend) return;

    const { variation, windBias = 1 } = peca.data;
    const pressa = windBias * variation.windJitter;

    // A onda de soltura corre de cima para baixo, e chega em cada altura
    // ANTES do papel — que ainda precisa vencer a propria sobra antes de
    // descobrir o primeiro pixel. E o que garante que nenhum adesivo seja
    // encontrado parado sobre a pagina ja revelada.
    //
    // `data.y` e a posicao de PROJETO, nao a que a fisica da cena 3 deixou.
    // Como onda basta: o que importa e a leitura de cima para baixo, e nao
    // casar peca a peca.
    const altura = clamp(peca.data.y, 0, 100) / 100;
    const solta = Math.max(
      cfg.wave * altura + (variation.driftSeed - 0.5) * cfg.waveJitter,
      0,
    );

    // O temperamento de cada peca (`windBias`, que antes decidia o quanto ela
    // se deixava levar pelo vento) agora decide o quanto ela tem pressa de
    // cair. A duracao sai do peso, e nao o contrario: assim uma peca leve
    // demora mais no ar e mesmo assim termina fora do quadro.
    const peso = 1 + (pressa - 1) * cfg.weightJitter;
    const duracao = travessia / Math.sqrt(peso);

    tl.to(
      peca.inner,
      {
        physics2D: {
          // Um empurrao curto no instante em que descola — sem ele o comeco
          // da queda e lento demais e a peca parece presa mais um quadro.
          velocity: stage.u(cfg.release) * pressa,
          angle: ABAIXO + variation.rotJitter * cfg.drift,
          gravity: gravidade * peso,
        },
        // Giro curto e de sinal proprio. Grande seria revoada; aqui o papel
        // so tomba, e a tipografia continua legivel ate sair.
        rotation: `+=${(cfg.spin + cfg.spinJitter * variation.driftSeed) * variation.spinSign}`,
        duration: duracao,
        ease: 'none',
        force3D: true,
      },
      solta,
    );
  });

  return tl;
}
