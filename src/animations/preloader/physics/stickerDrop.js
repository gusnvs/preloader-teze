/**
 * A CHUVA DE ADESIVOS — simulação física.
 *
 * Descoberta ao inspecionar o screensaver do warmnfuzzy.tv quadro a quadro:
 * a tela não se preenche por revelação escalonada. Os adesivos **caem do
 * topo**, colidem entre si e **empilham a partir do chão**. A "linha d'água"
 * que sobe é a altura da pilha crescendo.
 *
 * Isso muda tudo: nenhum ajuste de `stagger` reproduz o efeito, porque a
 * densidade e a irregularidade não são projetadas — elas EMERGEM das
 * colisões. Duas peças nunca se sobrepõem do mesmo jeito, e mesmo assim não
 * sobra buraco, porque o próprio solver empurra cada peça para o vão livre
 * mais próximo.
 *
 * Três decisões que fazem a diferença entre "caixas caindo" e "adesivos":
 *
 *  1. O COLISOR É MENOR QUE O DESENHO (`colliderScale`). Se o corpo tivesse
 *     o tamanho da arte, as peças parariam encostadas e a parede ficaria com
 *     frestas. Encolhendo o colisor, elas se sobrepõem visualmente enquanto
 *     a física continua estável — é daí que vem a densidade.
 *
 *  2. NADA QUICA (`restitution: 0`) e tudo tem atrito alto. Papel colado não
 *     tem energia de volta; um adesivo que quica lê como plástico.
 *
 *  3. A SIMULAÇÃO É DETERMINÍSTICA. Passo fixo e aleatoriedade semeada: a
 *     mesma pilha em toda execução, e portanto ajustável pelo olho.
 */

import { Bodies, Body, Composite, Engine } from 'matter-js';
import { createJitter } from '../../../utils/math.js';

/** Passo fixo da simulação, em ms. Nunca varia com o FPS real. */
const PASSO_MS = 1000 / 60;
/** Teto de passos por quadro: impede espiral de morte se a aba travar. */
const MAX_PASSOS_POR_QUADRO = 4;

/**
 * @param {object} options
 * @param {Array} options.pieces  peças que participam da queda
 * @param {object} options.stage  medidas congeladas do palco
 * @param {object} options.cfg    bloco `drop` de motion.config
 */
export function createStickerDrop({ pieces, stage, cfg }) {
  const jitter = createJitter(cfg.seed);

  const engine = Engine.create({
    gravity: { x: 0, y: cfg.gravity },
    // Mais iterações = pilha mais estável, sem peças afundando umas nas
    // outras. É o parâmetro que separa um monte de lixo de uma parede.
    positionIterations: cfg.positionIterations,
    velocityIterations: cfg.velocityIterations,
    enableSleeping: true,
  });

  const { width, height } = stage;
  const espessura = 400;

  // Chão e paredes. O chão fica um pouco ABAIXO da borda: as peças de baixo
  // ficam cortadas pelo quadro, como numa parede de adesivos real.
  const paredes = [
    Bodies.rectangle(width / 2, height + espessura / 2 - cfg.floorBleed, width * 3, espessura, {
      isStatic: true,
    }),
    Bodies.rectangle(-espessura / 2 + cfg.wallBleed, height / 2, espessura, height * 4, {
      isStatic: true,
    }),
    Bodies.rectangle(width + espessura / 2 - cfg.wallBleed, height / 2, espessura, height * 4, {
      isStatic: true,
    }),
  ];
  Composite.add(engine.world, paredes);

  // --- Um corpo por peça -------------------------------------------------
  const atores = [];

  pieces.forEach((piece, index) => {
    // `offset*` e não `getBoundingClientRect`: no momento em que medimos, a
    // peça já está girada pelo ângulo de projeto, e o retângulo delimitador
    // de algo girado é maior que a própria peça. O colisor sairia inflado, a
    // pilha ficaria alta demais e cheia de frestas.
    const w = Math.max(piece.media.offsetWidth, 8);
    const h = Math.max(piece.media.offsetHeight, 8);

    // Onde a peça "mora" no DOM: o transform da física é sempre relativo a
    // esta âncora, e não a coordenadas absolutas de tela.
    const ancora = {
      x: (piece.data.x / 100) * width,
      y: (piece.data.y / 100) * height,
    };

    // Ordem de entrada: quem preenche cai primeiro e fica embaixo; as peças
    // narrativas caem por último e pousam POR CIMA, onde podem ser lidas.
    const ondaBase = piece.data.isFill ? 0 : cfg.narrativeDelay;
    const nascimento = ondaBase + jitter.range(0, cfg.spawnWindow) + index * cfg.spawnStagger;

    const corpo = Bodies.rectangle(
      ancora.x + jitter.spread(cfg.spawnJitterX * width),
      -h * jitter.range(1.2, cfg.spawnHeight),
      w * cfg.colliderScale,
      h * cfg.colliderScale,
      {
        angle: (piece.data.rot * Math.PI) / 180,
        restitution: 0,
        friction: cfg.friction,
        frictionAir: cfg.frictionAir,
        density: 0.001,
        // Dormir cedo economiza CPU: uma peça que já assentou não precisa
        // ser resolvida em todo quadro.
        sleepThreshold: cfg.sleepThreshold,
      },
    );

    // Quanto a peça pode girar durante a queda.
    //
    // Rotação livre é o que a referência faz — e lá funciona, porque os
    // adesivos dela são grafismos que leem em qualquer ângulo. Os da Tezê
    // são tipografia: um recibo ou um cartão-postal de cabeça para baixo
    // não lê como colagem, lê como defeito.
    //
    // Inércia alta (não infinita) mantém o ângulo de projeto de cada peça e
    // ainda deixa a pilha acomodar alguns graus no impacto — que é o que
    // separa "empilhado" de "carimbado".
    if (cfg.rotationInertia > 0) {
      Body.setInertia(corpo, corpo.mass * cfg.rotationInertia);
      Body.setAngularVelocity(corpo, jitter.spread(cfg.spin));
    } else {
      // `Infinity` zera `inverseInertia`, e é isso — e não um valor alto —
      // que impede qualquer resposta angular a colisão.
      Body.setInertia(corpo, Infinity);
    }

    // Um desalinho de poucos graus, sorteado e estável, devolvido só na
    // entrega. Barato, controlado, e impossível de virar de ponta-cabeça.
    const acomodacao = jitter.spread(cfg.settleTilt ?? 0);

    atores.push({ piece, corpo, ancora, nascimento, acomodacao, solto: false });
  });

  // Ordena por nascimento para que a soltura seja um simples avanço de índice.
  atores.sort((a, b) => a.nascimento - b.nascimento);

  let tempoSim = 0;
  let proximo = 0;

  /** Escreve a física no DOM. Caminho rápido: `style.transform` direto. */
  function sincronizar() {
    for (let i = 0; i < atores.length; i += 1) {
      const { piece, corpo, ancora, solto } = atores[i];
      if (!solto) continue;
      const grausRot = (corpo.angle * 180) / Math.PI;
      piece.inner.style.transform =
        `translate3d(${(corpo.position.x - ancora.x).toFixed(2)}px,` +
        `${(corpo.position.y - ancora.y).toFixed(2)}px,0) rotate(${grausRot.toFixed(2)}deg)`;
    }
  }

  /** Avança a simulação até `tempoAlvo` (em segundos). */
  function avancarPara(tempoAlvo) {
    const alvoMs = tempoAlvo * 1000;
    let passos = 0;

    while (tempoSim < alvoMs && passos < MAX_PASSOS_POR_QUADRO) {
      // Solta quem chegou a hora, um por vez.
      while (proximo < atores.length && atores[proximo].nascimento * 1000 <= tempoSim) {
        const ator = atores[proximo];
        Composite.add(engine.world, ator.corpo);
        ator.solto = true;
        ator.piece.inner.style.opacity = '1';
        proximo += 1;
      }

      Engine.update(engine, PASSO_MS);
      tempoSim += PASSO_MS;
      passos += 1;
    }

    sincronizar();
  }

  /**
   * Devolve o palco ao GSAP.
   *
   * Durante a queda escrevemos `style.transform` na mão — é o caminho mais
   * barato para ~140 elementos por quadro, mas passa por fora do cache do
   * GSAP. No fim, um `gsap.set` por peça reconcilia os dois, senão as cenas
   * 6 e 7 partiriam de um estado que o GSAP acha que é outro.
   *
   * Também atualiza `data.x/y` para onde a peça REALMENTE parou: a reação às
   * pegadas e a varredura do vento usam essa posição, e a posição de projeto
   * deixou de valer no instante em que a física assumiu.
   */
  function entregar(gsap) {
    atores.forEach(({ piece, corpo, ancora, acomodacao }) => {
      const grausRot = (corpo.angle * 180) / Math.PI + acomodacao;
      piece.inner.style.transform = '';
      gsap.set(piece.inner, {
        x: corpo.position.x - ancora.x,
        y: corpo.position.y - ancora.y,
        rotation: grausRot,
        scale: 1,
        opacity: 1,
      });
      piece.data.x = (corpo.position.x / width) * 100;
      piece.data.y = (corpo.position.y / height) * 100;
      piece.data.rot = grausRot;
    });
  }

  function destruir() {
    Composite.clear(engine.world, false);
    Engine.clear(engine);
  }

  if (import.meta.env.DEV) window.__queda = { engine, atores };

  return { avancarPara, entregar, destruir, atores };
}
