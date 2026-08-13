/**
 * Gramatica de entrada compartilhada pelas cenas 1 e 2.
 *
 * As duas cenas contam a mesma acao — uma figurinha e assentada na parede —
 * mudando so a intensidade e o ritmo. Manter o gesto em um lugar so garante
 * que a colagem inteira pareca feita pela mesma mao, e faz qualquer ajuste
 * de direcao valer para os dois atos de uma vez.
 *
 * O gesto tem tres partes, e a ordem entre elas e o efeito inteiro:
 *
 *   1. a figurinha APARECE ja levantada — nao ha fade de imagem, ha um
 *      objeto que ja estava na mao. O clarao curto de opacidade existe so
 *      para o primeiro quadro nao ser um corte seco;
 *
 *   2. a figurinha COLA: a linha de contato atravessa a arte enquanto a
 *      parte ainda solta continua curvada no ar. E a `PeelSticker` quem faz
 *      isso; daqui sai apenas o progresso, de 0 a 1;
 *
 *   3. a MAO ACOMODA: um resto de rotacao e de escala que se resolve junto,
 *      curto e quase imperceptivel. Sem ele a peca parece impressa no lugar;
 *      com ele, parece ter sido posta ali por alguem.
 *
 * A acomodacao termina DEPOIS da colagem, e nao antes: o polegar solta o
 * papel e a mao ainda ajeita a peca por um instante.
 */

import { gsap } from 'gsap';

/** Vetor de origem por sabor de entrada, em unidades de composicao. */
const ORIGIN = {
  up: (d) => ({ x: 0, y: -d }),
  down: (d) => ({ x: 0, y: d }),
  left: (d) => ({ x: -d * 1.4, y: -d * 0.3 }),
  right: (d) => ({ x: d * 1.4, y: -d * 0.3 }),
  settle: (d) => ({ x: 0, y: -d * 0.3 }),
};

/**
 * Constroi a entrada de uma peca.
 *
 * @param {object} piece  peca criada por `createCollagePiece`
 * @param {object} cfg    bloco de configuracao da cena (awaken/gather)
 * @param {object} stage  medidas congeladas do palco
 * @returns {gsap.core.Timeline}
 */
export function entranceFrom(piece, cfg, stage) {
  const { data, inner, media, peel, node } = piece;
  const { variation } = data;

  const tl = gsap.timeline();

  // Deslocamento curto: a peca chega quase no lugar. Ela nao voa ate a
  // parede — ela e POSTA na parede, e o que sobra e o acerto de mao.
  const distance = cfg.approach * variation.windJitter;
  const origin = (ORIGIN[data.from] ?? ORIGIN.settle)(distance);
  const rotationFrom = data.rot + cfg.rotationOffset * variation.rotOffsetSign + variation.rotJitter;

  tl.fromTo(
    inner,
    {
      x: stage.u(origin.x),
      y: stage.u(origin.y),
      rotation: rotationFrom,
      scale: cfg.scaleFrom,
      opacity: 0,
    },
    {
      x: 0,
      y: 0,
      rotation: data.rot,
      scale: 1,
      opacity: 1,
      duration: cfg.duration * 1.12,
      ease: cfg.ease,
      force3D: true,
    },
    0,
  );

  // A opacidade resolve quase de imediato: papel nao aparece aos poucos
  // enquanto e colado, ele ja esta la.
  tl.to(inner, { opacity: 1, duration: cfg.duration * 0.16, ease: 'none' }, 0);

  // Camada de reacao zerada e explicita — a cena 5 conta com ela limpa.
  tl.set(media, { rotation: 0, y: 0, scale: 1 }, 0);

  // --- A colagem ----------------------------------------------------------
  if (peel) {
    // `peel.progress` e uma propriedade comum: o GSAP escreve nela como
    // escreveria em qualquer objeto, e a figurinha se redesenha sozinha.
    // Nenhum `onUpdate`, nenhum proxy, nenhum callback de preparo — a
    // propria propriedade sabe se levantar de novo (ver `PeelSticker.js`).
    tl.fromTo(
      peel,
      { progress: 0 },
      {
        progress: 1,
        duration: cfg.duration,
        ease: cfg.pressEase ?? 'tz.press',
      },
      cfg.duration * (cfg.pressDelay ?? 0),
    );

    // Colada: as faixas saem de cena e sobra uma imagem so. O resto da
    // timeline — a chuva, as pegadas, a queda — nao deve pagar por um efeito
    // que ja terminou. Se este callback for perdido num arraste, o que se
    // perde e a economia; a imagem e a mesma.
    tl.call(() => peel.settle(), null, cfg.duration * 1.04);
  }

  return tl;
}
