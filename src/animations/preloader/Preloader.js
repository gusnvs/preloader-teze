/**
 * PRE-LOADER — orquestrador.
 *
 * Responsabilidades, e nada alem delas:
 *   · construir o palco uma unica vez e mante-lo pronto;
 *   · decidir qual leitura da historia rodar (completa, expressa, reduzida);
 *   · sortear as pecas raras de cada execucao;
 *   · devolver uma Promise que resolve quando a transicao termina;
 *   · avisar, no meio do caminho, que a tela esta coberta.
 *
 * Quem chama nao sabe o que e uma cena. O roteador so precisa de:
 *
 *     await preloader.run({ onCommit: () => trocarPagina() })
 */

import { gsap } from 'gsap';

import { registerEases } from '../eases.js';
import { buildPreloaderStage } from '../../components/PreloaderStage.js';
import { buildTimeline } from './buildTimeline.js';
import { createTimelineReduzida } from './scenes/scene-reduzida.js';
import { MOTION, MOTION_REDUCED } from '../../config/motion.config.js';
import { measureStage, isPortrait } from '../../utils/viewport.js';
import { decodeImages, nextFrame } from '../../utils/dom.js';
import { prefersReducedMotion, watchMotionPreference } from '../../utils/motionPreference.js';
import { createRandom } from '../../utils/math.js';

export class Preloader {
  #root;
  #getPage;
  #stageData = null;
  #timeline = null;
  #running = false;
  #ready = null;
  #orientation = null;
  #random = createRandom(Date.now() % 2147483647);
  #unwatchMotion = null;
  #onResize = null;

  /**
   * @param {{ root: HTMLElement, getPage: () => HTMLElement | null }} options
   */
  constructor({ root, getPage }) {
    this.#root = root;
    this.#getPage = getPage;
  }

  /** Prepara o palco. Idempotente. */
  async prepare() {
    if (this.#ready) return this.#ready;

    this.#ready = (async () => {
      registerEases();

      // `force3D` NAO entra aqui de proposito. Como default global ele
      // seria aplicado tambem a tweens sem alvo de DOM — os `.call()` da
      // timeline, por exemplo — e o GSAP avisa "Invalid property force3D"
      // a cada execucao. Cada cena declara `force3D` nos tweens de
      // transform, que sao os unicos onde ele significa alguma coisa.
      gsap.defaults({ overwrite: 'auto' });
      gsap.ticker.lagSmoothing(500, 33);

      this.#mountStage();

      // Decodificar antes de animar: o custo de decode de ~20 imagens no
      // primeiro quadro e a causa mais comum de engasgo em pre-loaders.
      await decodeImages(this.#root);
      await nextFrame();

      this.#observeEnvironment();
    })();

    return this.#ready;
  }

  /**
   * Roda a transicao completa.
   *
   * @param {object} options
   * @param {() => void} [options.onCommit]  chamado com a tela coberta
   * @param {'full'|'express'} [options.variant]
   * @param {number} [options.timeScale]  sobrescreve a escala de tempo
   * @returns {Promise<void>}
   */
  async run({ onCommit, variant = 'full', timeScale } = {}) {
    await this.prepare();

    if (this.#running) {
      // Uma transicao ja em curso nunca e interrompida: a troca de pagina
      // pedida agora entra na que ja esta rodando.
      onCommit?.();
      return;
    }

    this.#running = true;
    const { refs } = this.#stageData;

    refs.container.classList.add('is-active', 'is-running');
    refs.status.textContent = 'Carregando';

    const reduced = prefersReducedMotion();
    const variantCfg = MOTION.variants[variant] ?? MOTION.variants.full;

    this.#castRarePieces();
    this.#resetStage();

    const ctx = this.#createContext();
    let committed = false;
    const commitOnce = () => {
      if (committed) return;
      committed = true;
      onCommit?.();
    };

    this.#timeline = reduced
      ? createTimelineReduzida({ ...ctx, motion: MOTION_REDUCED, onCommit: commitOnce })
      : buildTimeline(ctx, { onCommit: commitOnce });

    this.#timeline.timeScale(timeScale ?? MOTION.timeScale * (reduced ? 1 : variantCfg.timeScale));

    await new Promise((resolve) => {
      this.#timeline.eventCallback('onComplete', resolve);
      this.#timeline.play(0);
    });

    // Rede de seguranca: se a timeline for alterada e o rotulo sumir, a
    // pagina ainda precisa ser trocada.
    commitOnce();

    refs.container.classList.remove('is-active', 'is-running');
    refs.status.textContent = '';
    this.#timeline.kill();
    this.#timeline = null;
    this.#running = false;
  }

  get isRunning() {
    return this.#running;
  }

  /** Timeline atual — usada pelas ferramentas de desenvolvimento. */
  get timeline() {
    return this.#timeline;
  }

  get stageData() {
    return this.#stageData;
  }

  destroy() {
    this.#timeline?.kill();
    this.#unwatchMotion?.();
    if (this.#onResize) window.removeEventListener('resize', this.#onResize);
    this.#root.replaceChildren();
    this.#stageData = null;
    this.#ready = null;
  }

  // --- interno ------------------------------------------------------------

  #mountStage() {
    this.#orientation = isPortrait();
    this.#stageData = buildPreloaderStage(this.#root, {
      trailSteps: MOTION.variants.full.trailSteps,
      // A preferencia e lida na montagem porque ela decide a ESTRUTURA: sem
      // movimento, a figurinha que cola nem chega a criar as suas faixas.
      reduced: prefersReducedMotion(),
    });
  }

  /**
   * Sorteia quais pecas raras entram nesta execucao.
   * A pata quase nunca aparece — ver a nota em `collage.config.js`.
   */
  #castRarePieces() {
    this.#stageData.pieces.forEach((piece) => {
      const rarity = piece.data.rarity ?? 1;
      const present = rarity >= 1 || this.#random() < rarity;
      piece.present = present;
      // `display` tira a peca do fluxo de composicao e do custo de pintura.
      piece.node.style.display = present ? '' : 'none';
    });
  }

  /** Devolve o palco ao estado neutro antes de cada execucao. */
  #resetStage() {
    const { refs, pieces, prints } = this.#stageData;

    gsap.set(refs.container, { opacity: 0 });
    gsap.set(refs.mural, { clearProps: 'transform' });
    // O papel cai junto com a colagem na cena 7 e termina fora da tela. Sem
    // devolver a posicao aqui, a navegacao seguinte comecaria sem fundo.
    gsap.set([refs.veil, refs.grain], { clearProps: 'transform' });
    gsap.set([refs.noise, refs.vignette], { clearProps: 'opacity' });
    gsap.set(refs.mark, { opacity: 0, y: 0 });
    gsap.set(refs.rule, { scaleX: 0 });

    pieces.forEach((piece) => {
      // Devolve a geometria de projeto antes de tudo: a cena 3 sobrescreve
      // `data.x/y/rot` com o resultado da física, e sem restaurar aqui cada
      // execução partiria de onde a anterior parou.
      Object.assign(piece.data, piece.origem);

      gsap.set(piece.inner, { x: 0, y: 0, rotation: piece.data.rot, scale: 1, opacity: 0 });
      gsap.set(piece.media, { x: 0, y: 0, rotation: 0, scale: 1 });

      // A figurinha volta a estar solta — e volta ASSENTADA, com as faixas
      // fora da arvore de pintura. Elas so entram no instante em que aquela
      // peca comeca a colar (ver `entrance.js`): manter dezenas delas vivas
      // durante a animacao inteira custaria mais do que a animacao toda.
      if (piece.peel) {
        piece.peel.reset();
        piece.peel.settle();
        delete piece.peel.node.dataset.peeling;
      }
    });

    prints.forEach((print) => {
      gsap.set(print.node, { opacity: 0 });
      gsap.set(print.media, { scale: 1 });
    });
  }

  /** Contexto compartilhado por todas as cenas. */
  #createContext() {
    const { refs, pieces, prints } = this.#stageData;
    return {
      refs,
      // Cenas so enxergam as pecas presentes nesta execucao.
      pieces: pieces.filter((piece) => piece.present !== false),
      prints,
      motion: MOTION,
      // Medido uma vez por execucao: nenhuma cena le layout durante a animacao.
      stage: measureStage(refs.container),
      getPage: this.#getPage,
    };
  }

  #observeEnvironment() {
    // Girar o dispositivo muda a composicao (ha uma variante de retrato),
    // entao o palco e remontado — nunca durante uma transicao.
    this.#onResize = () => {
      if (this.#running) return;
      const portrait = isPortrait();
      if (portrait === this.#orientation) return;
      this.#mountStage();
      decodeImages(this.#root);
    };

    window.addEventListener('resize', this.#onResize, { passive: true });

    // A preferencia de movimento agora decide ESTRUTURA, e nao so ritmo: sem
    // movimento, as figurinhas nem criam as suas faixas. Mudar a preferencia
    // com o palco montado exige remonta-lo — nunca durante uma transicao.
    this.#unwatchMotion = watchMotionPreference(() => {
      if (this.#running) return;
      this.#mountStage();
      decodeImages(this.#root);
    });
  }
}
