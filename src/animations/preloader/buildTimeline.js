/**
 * MONTAGEM DA LINHA DO TEMPO
 *
 * Este arquivo nao anima nada. Ele conhece a ORDEM das cenas e o momento
 * em que a pagina pode ser trocada — nada alem disso. Cada cena continua
 * sendo uma unidade fechada, testavel e substituivel.
 *
 * A coreografia (quais cenas, em que posicao, com quanta sobreposicao) vem
 * de `motion.config.js`. Acrescentar uma cena nova e escrever o modulo,
 * registra-lo em SCENES e adicionar uma linha na coreografia.
 */

import { gsap } from 'gsap';

import { createSceneDespertar } from './scenes/scene-01-despertar.js';
import { createSceneReuniao } from './scenes/scene-02-reuniao.js';
import { createSceneMural } from './scenes/scene-03-mural.js';
import { createSceneRastro } from './scenes/scene-04-rastro.js';
import { createSceneReacao } from './scenes/scene-05-reacao.js';
import { createSceneBrisa } from './scenes/scene-06-brisa.js';
import { createSceneQueda } from './scenes/scene-07-queda.js';
import { createSceneRevelacao } from './scenes/scene-08-revelacao.js';

/**
 * Registro de cenas. A chave e o nome usado na coreografia.
 * Cada fabrica recebe o contexto e devolve uma timeline.
 */
const SCENES = {
  awaken: createSceneDespertar,
  gather: createSceneReuniao,
  mural: createSceneMural,
  breeze: createSceneBrisa,
  fall: createSceneQueda,
  reveal: createSceneRevelacao,
};

/**
 * Constroi a timeline principal.
 *
 * @param {object} ctx  { refs, pieces, prints, motion, stage, getPage }
 * @param {{ onCommit: () => void }} hooks
 * @returns {gsap.core.Timeline}
 */
export function buildTimeline(ctx, { onCommit }) {
  const master = gsap.timeline({ paused: true });
  const { motion } = ctx;

  motion.choreography.forEach(({ scene, at }) => {
    // Cenas 4 e 5 sao um par: o rastro produz os instantes de impacto e a
    // reacao os consome. Elas entram embrulhadas em uma unica timeline —
    // e nao lado a lado — porque a posicao ">" da cena seguinte se refere
    // ao ultimo filho adicionado. Soltas, o vento comecaria a soprar
    // enquanto a pata ainda estivesse atravessando a tela.
    if (scene === 'footsteps') {
      const { timeline, landings } = createSceneRastro(ctx);
      const reactions = createSceneReacao(ctx, landings);

      const passagem = gsap.timeline();
      passagem.add(timeline, 0);
      passagem.add(reactions, 0);

      master.add(passagem, at);
      master.addLabel('rastro', '<');
      return;
    }

    const factory = SCENES[scene];
    if (!factory) {
      if (import.meta.env.DEV) console.warn(`[timeline] cena desconhecida: "${scene}"`);
      return;
    }

    master.add(factory(ctx), at);
    master.addLabel(scene, `<`);
  });

  // O instante em que o mural cobre a tela: a troca de conteudo acontece
  // aqui, escondida atras da colagem. Posicionado logo apos o inicio do
  // rastro, quando a composicao ja esta inteira e a atencao esta nos passos.
  const commitAt = master.labels.rastro ?? master.duration() * 0.5;
  master.addLabel(motion.commitLabel, commitAt);
  master.call(onCommit, null, commitAt);

  return master;
}
