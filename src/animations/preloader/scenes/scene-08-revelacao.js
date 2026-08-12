/**
 * CENA 8 — REVELACAO
 *
 * A limpeza — e ela e curta, porque a revelacao propriamente dita ja
 * aconteceu na cena 7: quem descobre a pagina e a borda do papel descendo,
 * nao um fade por cima de tudo.
 *
 * Sobra o que NAO cai. O grao fino e a vinheta cobrem a tela inteira, e nao
 * o mural: se ficassem, a pagina nova estrearia com uma sombra quente nos
 * cantos que nao e dela. Eles se dissolvem enquanto o papel ainda esta
 * saindo — as duas coisas no mesmo intervalo, com curvas diferentes, que e o
 * que impede a transicao de ter um "fim" perceptivel.
 *
 * O conteudo da pagina ja foi trocado la atras, no rotulo `coberto`, quando
 * a colagem cobria tudo. Aqui so se revela o que ja estava pronto.
 */

import { gsap } from 'gsap';

export function createSceneRevelacao({ refs, motion, getPage }) {
  const cfg = motion.reveal;
  const tl = gsap.timeline();

  tl.to([refs.noise, refs.vignette], { opacity: 0, duration: cfg.duration, ease: cfg.ease }, 0);

  // A entrada da pagina e a UNICA parte da transicao que nao e feita com
  // GSAP, e por um motivo de ciclo de vida: a pagina so passa a existir no
  // meio da timeline (no rotulo `coberto`), entao ela nao pode ser alvo de
  // um tween construido antes. Um tween solto criado dentro de um callback
  // sobreviveria ao `kill()` da timeline e deixaria estilos inline
  // residuais no DOM — inclusive um `transform` identidade, que ancoraria
  // qualquer filho `position: fixed` na pagina em vez de na viewport.
  //
  // Uma classe CSS resolve isso sem nenhum acoplamento: a curva vive em
  // `--tz-ease-settle`, o navegador cuida da interpolacao, e o DOM volta
  // limpo sozinho quando a transicao termina.
  //
  // O instante e cedo de proposito: a pagina precisa estar chegando ENQUANTO
  // o papel desce, para que a borda descubra conteudo e nao um vazio.
  tl.add(() => {
    getPage()?.classList.remove('is-entering');
  }, cfg.duration * 0.14);

  return tl;
}
