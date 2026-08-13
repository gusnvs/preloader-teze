/**
 * ADAPTADOR NUVEMSHOP — ponto de entrada do bundle que vai para o tema.
 *
 * Este arquivo e o equivalente de `main.js` para uma loja. A diferenca entre
 * os dois e so o CONTRATO: no laboratorio o pre-loader cobre a tela para que
 * um roteador troque a pagina por baixo; aqui ele cobre a tela para que uma
 * pagina que ja existe, e que esta escondida desde o primeiro quadro, seja
 * descoberta no momento certo.
 *
 *   laboratorio   preloader.run({ onCommit: trocarPagina })
 *   loja          preloader.run({ onCommit: revelarPagina })
 *
 * Nada mais muda. Nenhuma cena, nenhum tempo, nenhuma medida.
 *
 * TRES COISAS ESTE ARQUIVO NAO FAZ
 *
 *   · nao decide se o pre-loader deve rodar. Isso ja foi decidido no `<head>`,
 *     antes de qualquer pixel — se este arquivo chegou a ser baixado, e
 *     porque a resposta foi sim (ver `snipplets/preloader.tpl`);
 *   · nao esconde a pagina. Quem esconde e uma regra de CSS embutida no
 *     `<head>`, presa a uma classe no `<html>`. Esconder por JS chegaria
 *     tarde demais — a Home ja teria piscado;
 *   · nao guarda a marca de sessao. Ela e gravada no instante da decisao, e
 *     nao no fim: quem sai no meio da animacao nao merece ve-la de novo ao
 *     voltar.
 *
 * O que ele faz e garantir que a loja volte ao normal DE QUALQUER JEITO. Toda
 * saida deste modulo — sucesso, erro, demora, aparelho lento — passa por
 * `concluir()`: pagina visivel, rolagem destravada, palco fora do DOM.
 */

import { gsap } from 'gsap';

import { Preloader } from '../animations/preloader/Preloader.js';
import { MOTION_REDUCED } from '../config/motion.config.js';

import '../styles/tokens.css';
import '../styles/peel.css';
import '../styles/preloader.css';
import './theme.css';

/** Configuracao injetada pelo template. Ver `snipplets/preloader.tpl`. */
const cfg = (typeof window !== 'undefined' && window.TZ_PRELOADER) || {};

/**
 * A revelacao pertence ao `<head>`, e nao a este modulo.
 *
 * O motivo e que existem DOIS caminhos ate ela: a timeline chegando ao rotulo
 * `coberto`, e a rede de seguranca de nove segundos disparando porque este
 * arquivo nunca carregou. Duas implementacoes se contradiriam no pior momento
 * possivel — entao ha uma so, la, e as duas pontas chamam a mesma.
 *
 * O fallback existe para o caso de este bundle ser carregado fora do seu
 * contexto (um teste, um preview): a pagina aparece, que e o que importa.
 */
const revelar =
  typeof cfg.revelar === 'function'
    ? cfg.revelar
    : () => document.documentElement.classList.remove(cfg.htmlClass || 'tz-preloading');

/**
 * O fim de tudo — inclusive da trava de rolagem.
 *
 * Separado de `revelar()` porque as duas coisas terminam em momentos
 * diferentes. A Home e descoberta no rotulo `coberto`, no meio da animacao;
 * a rolagem so pode voltar quando a ultima peca sair da tela. Destravar junto
 * com a revelacao daria dois segundos e meio de pagina rolando por tras da
 * colagem.
 */
const concluir = typeof cfg.concluir === 'function' ? cfg.concluir : revelar;

const reduzido =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Espera uma promessa, mas nunca alem de `ms`.
 *
 * Devolve `true` se a promessa venceu a corrida. O relogio e limpo nos dois
 * casos: um `setTimeout` de segundos sobrevivendo a animacao inteira seria
 * exatamente o tipo de resto que este projeto nao deixa.
 */
function comTeto(promessa, ms) {
  let relogio;
  return Promise.race([
    Promise.resolve(promessa).then(() => true),
    new Promise((resolve) => {
      relogio = setTimeout(() => resolve(false), ms);
    }),
  ]).finally(() => clearTimeout(relogio));
}

/**
 * A rede de seguranca do `<head>` ja desistiu de esperar por nos?
 *
 * O caso e real: um arquivo de 200 kB numa rede ruim pode chegar depois do
 * relogio disparar. A Home ja esta na tela, alguem ja esta lendo — comecar
 * agora uma abertura de oito segundos por cima seria pior do que nao ter
 * abertura nenhuma. Este modulo verifica isso a cada espera.
 */
const desistiram = () => cfg.expirado === true;

/**
 * O botao de pular.
 *
 * Nao interrompe a timeline: ACELERA. Cortar no meio deixaria peças paradas
 * em posicoes que nenhuma cena seguinte espera, e o `onCommit` — que e o que
 * revela a pagina — poderia nem chegar a ser chamado. Acelerando, a historia
 * inteira acontece, so que em menos de um segundo: todos os callbacks
 * disparam na ordem, a limpeza roda igual, e o fim e o mesmo fim.
 */
function montarBotaoPular(preloader) {
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'tz-preloader__skip';
  botao.textContent = cfg.skipLabel || 'Pular';

  let acelerado = false;

  const acelerar = () => {
    if (acelerado) return;
    acelerado = true;

    botao.disabled = true;
    botao.classList.remove('is-visible');

    const tl = preloader.timeline;
    if (!tl) return concluir();

    // Quanto falta, em tempo de timeline (nao afetado pelo `timeScale`).
    const restante = Math.max(tl.duration() - tl.time(), 0.01);
    // A escala que encerra isso em ~0,7 s reais. O teto evita que um clique
    // no primeiro segundo transforme a saida em um piscar.
    const alvo = Math.min(Math.max(restante / 0.7, 4), 24);

    gsap.to(tl, { timeScale: alvo, duration: 0.3, ease: 'power2.in' });
  };

  const aoTeclar = (evento) => {
    if (evento.key === 'Escape') acelerar();
  };

  botao.addEventListener('click', acelerar);
  document.addEventListener('keydown', aoTeclar);
  document.body.appendChild(botao);

  // A porta de saida aparece depois que a historia comecou.
  const entrada = setTimeout(
    () => botao.classList.add('is-visible'),
    cfg.skipAfter != null ? cfg.skipAfter : 1500,
  );

  return {
    destruir() {
      clearTimeout(entrada);
      botao.removeEventListener('click', acelerar);
      document.removeEventListener('keydown', aoTeclar);
      botao.remove();
    },
  };
}

/**
 * MOVIMENTO REDUZIDO: MANTER A CENA, ENCURTAR O RELOGIO.
 *
 * A variante reduzida nao anima deslocamento algum — e so opacidade e tempo,
 * peca a peca. Mas o `stagger` dela e POR PECA, e corre duas vezes (entrando
 * e saindo). Com a densidade alta deste projeto isso da:
 *
 *     0.42 + 0.34 + 0.42 + 162 x 0.012 x 2  ~=  5,1 s
 *
 * Medido no navegador: 5,5 s. O laboratorio anuncia 2,0 s porque foi medido
 * com um terco das pecas — o numero nao era falso, so nao escalava.
 *
 * Cinco segundos e meio e o oposto do que a preferencia pede. E quem pediu
 * `reduce` costuma te-lo feito por enxaqueca, vertigem ou desconforto
 * vestibular: fazer essa pessoa esperar MAIS que as outras inverte o sentido
 * do ajuste.
 *
 * A correcao nao toca na cena, nao muda nenhum valor de `motion.config.js` e
 * nao inventa uma animacao nova: usa o `timeScale` que `run()` ja aceita, e
 * calcula a escala a partir das constantes da propria configuracao (por isso
 * ela e importada, e nao copiada — um ajuste la continua valendo aqui).
 *
 * Comprimir opacidade nao reintroduz movimento. O que se perde e o
 * escalonamento visivel peca a peca; o que se ganha e a promessa cumprida.
 *
 * @param {number} pecas  quantas pecas o palco montou nesta execucao
 * @param {number} alvoMs duracao desejada
 * @returns {number|undefined} escala, ou nada se ja couber no alvo
 */
function escalaParaMovimentoReduzido(pecas, alvoMs) {
  const m = MOTION_REDUCED;
  const estimativa = m.fadeIn + m.hold + m.fadeOut + pecas * m.stagger * 2;
  const escala = estimativa / (alvoMs / 1000);
  return escala > 1 ? escala : undefined;
}

/**
 * Espera o `<body>` existir.
 *
 * Este arquivo e injetado como script no `<head>`, e script inserido por JS e
 * assincrono: ele executa quando chega, nao onde foi escrito. Com o arquivo
 * ja em cache e um HTML grande sendo transmitido devagar, "quando chega" pode
 * ser ANTES de o analisador ter criado o `<body>` — e `document.body` seria
 * `null` no momento de pendurar o palco.
 *
 * Nao aconteceu em nenhum teste, o que nao e argumento nenhum: e uma corrida,
 * e corridas so aparecem em producao, no aparelho de outra pessoa.
 *
 * A espera e por quadro, e nao por `DOMContentLoaded`: o palco pode ser
 * montado assim que o `<body>` nascer, sem aguardar o documento inteiro. O
 * limite de quadros existe para que uma pagina que nunca termine de nascer
 * nao deixe um laco girando para sempre.
 */
async function esperarBody(limiteDeQuadros = 600) {
  let quadros = 0;
  while (!document.body && quadros < limiteDeQuadros && !desistiram()) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    quadros += 1;
  }
  return !!document.body;
}

/** O palco: um irmao do conteudo da loja, nunca um ancestral dele. */
function montarRaiz() {
  const existente = document.getElementById('tz-preloader-root');
  if (existente) return existente;

  const raiz = document.createElement('div');
  raiz.id = 'tz-preloader-root';

  // SEM `aria-hidden` aqui, e a distincao e importante: o palco monta dois
  // filhos, e eles tem naturezas opostas. A colagem e decorativa e ja se
  // declara oculta; ao lado dela mora um `role="status"` que anuncia o
  // carregamento. Marcar a raiz esconderia os dois — e o anuncio, que e a
  // unica parte acessivel de toda a experiencia, nunca chegaria a ninguem.
  document.body.appendChild(raiz);
  return raiz;
}

async function iniciar() {
  // Sem o mapa de enderecos nao ha colagem: na loja as URLs sao decididas
  // pela plataforma e chegam pelo HTML. Faltando, a Home aparece agora.
  if (!cfg.assets || !Object.keys(cfg.assets).length) {
    concluir();
    return;
  }

  // O CSS e carregado em paralelo com este arquivo, e os dois podem chegar em
  // qualquer ordem. Montar o palco antes da folha significaria um primeiro
  // quadro de colagem crua — pecas empilhadas no canto, sem posicao. O teto
  // existe porque uma folha que nunca chega nao pode prender a loja.
  if (cfg.cssReady) await comTeto(cfg.cssReady, 3000);
  if (desistiram()) return;

  if (!(await esperarBody())) {
    concluir();
    return;
  }
  if (desistiram()) return;

  const raiz = montarRaiz();
  const preloader = new Preloader({
    root: raiz,
    /**
     * No laboratorio isto devolvia a pagina recem-montada, para a cena 8
     * tirar dela a classe de entrada. Aqui devolve `null`, e de proposito.
     *
     * A pagina desta vez e a loja inteira, ja no DOM. Anima-la significaria
     * pousar `opacity` ou `transform` em um ancestral do cabecalho fixo e do
     * botao de WhatsApp — e `transform` em um ancestral faz `position: fixed`
     * se ancorar nele em vez de na viewport. O cabecalho passaria a rolar
     * com a pagina. A cena 8 usa `?.`, entao `null` e simplesmente um passo
     * que nao acontece.
     *
     * Nada se perde: quem descobre a pagina e a borda do papel descendo na
     * cena 7, e nao um fade por cima — exatamente como no projeto original.
     */
    getPage: () => null,
  });

  // `prepare()` monta ~143 nos e decodifica as imagens antes do primeiro
  // quadro. Numa rede lenta isso e a espera mais longa de toda a experiencia,
  // e ela acontece com a tela na cor do papel — vazia. Passando do teto,
  // desistimos da abertura em vez de fazer alguem esperar por ela: a marca de
  // sessao ja foi gravada, entao esta visita simplesmente ve a loja.
  const pronto = await comTeto(preloader.prepare(), cfg.prepareTimeout || 4000);

  if (!pronto || desistiram()) {
    concluir();
    preloader.destroy();
    raiz.remove();
    return;
  }

  // O `<head>` armou um relogio curto — o de esperar por este arquivo. A
  // partir daqui quem manda e a timeline, e o teto passa a ser o dela: sem
  // esta troca, a rede de seguranca cortaria a cena 6 no meio.
  cfg.assumiu?.();

  // Dois segundos (movimento reduzido) nao pedem porta de saida: ela chegaria
  // junto com o fim.
  const pular = reduzido ? null : montarBotaoPular(preloader);

  try {
    await preloader.run({
      variant: cfg.variant || 'full',
      // A tela esta coberta pela colagem. A loja deixa de estar escondida
      // AGORA, atras dela, para que a cena 7 tenha o que descobrir.
      onCommit: revelar,
      timeScale: reduzido
        ? escalaParaMovimentoReduzido(
            preloader.stageData?.pieces?.length ?? 0,
            cfg.reducedMaxDuration || 2000,
          )
        : undefined,
    });
  } finally {
    // Uma cena que lance nao pode deixar a loja escondida, a rolagem travada
    // nem o palco no DOM.
    concluir();
    pular?.destruir();
    preloader.destroy();
    raiz.remove();
  }
}

// Uma falha aqui nao pode custar a loja ao lojista: qualquer excecao termina
// com a Home visivel e sem resto no DOM.
iniciar().catch((erro) => {
  concluir();
  document.getElementById('tz-preloader-root')?.remove();
  document.querySelector('.tz-preloader__skip')?.remove();
  if (typeof console !== 'undefined') console.error('[tz-preloader]', erro);
});

// Namespace unico. Existe para que se possa encerrar a abertura de fora —
// um aplicativo, o console do lojista — sem conhecer nada do interior.
window.TZPreloader = {
  revelar,
  concluir,
  encerrar() {
    concluir();
    document.getElementById('tz-preloader-root')?.remove();
    document.querySelector('.tz-preloader__skip')?.remove();
  },
};
