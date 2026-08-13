/**
 * CONFIGURACAO DE MOVIMENTO
 *
 * Todo numero que define ritmo mora aqui. Ajustar a direcao de arte deve
 * ser editar este arquivo — nunca cacar valores dentro das cenas.
 *
 * Convencao de unidades:
 *   duration / stagger  -> segundos
 *   distancias          -> a mesma unidade da composicao (`--tz-unit`),
 *                          convertida em px pelo utilitario de viewport
 *   rotacoes            -> graus
 */

export const MOTION = {
  /** Multiplicador global. Use `?slow=0.3` na URL para inspecionar detalhes. */
  timeScale: 1,

  /**
   * Duas leituras da mesma historia.
   *  full    — primeira visita: a colagem se monta com calma.
   *  express — navegacao seguinte: mesmo roteiro, respiracao mais curta.
   * Repetir a versao longa a cada clique cansa; encurtar mantem o encanto.
   */
  variants: {
    full: { timeScale: 1, trailSteps: 11 },
    express: { timeScale: 1.55, trailSteps: 11 },
  },

  /**
   * CENA 1 — silencio visual: as tres primeiras figurinhas sao coladas.
   *
   * `stagger` aqui e generoso de proposito. Colar um adesivo e um GESTO, e
   * gesto precisa de tempo: com as pecas se atropelando, o que se ve e um
   * monte de coisa aparecendo — exatamente o que o efeito existe para nao
   * ser. Tres pecas, uma de cada vez, com silencio entre elas.
   */
  awaken: {
    veilDuration: 0.46,
    /** Quanto dura a colagem de uma figurinha, do levantado ao assentado. */
    duration: 0.96,
    stagger: 0.36,
    ease: 'tz.settle',
    /** O quanto a peca chega fora do lugar, em unidades. Curto: ela e POSTA
     *  na parede, nao voa ate ela. */
    approach: 4,
    rotationOffset: 4, // graus a mais na chegada, para "assentar" girando
    scaleFrom: 0.97,
    /** A curva da colagem, e o quanto ela espera o gesto de aproximacao. */
    pressEase: 'tz.press',
    pressDelay: 0.08,
    /** Preenchimento do fio de tinta ao lado da assinatura. */
    ruleDuration: 1.2,
  },

  /** CENA 2 — a colagem ganha corpo: mais tres, com a mao ja solta. */
  gather: {
    duration: 0.88,
    stagger: 0.3,
    ease: 'tz.settle',
    approach: 3.4,
    rotationOffset: 5,
    scaleFrom: 0.97,
    pressEase: 'tz.press',
    pressDelay: 0.05,
  },

  /**
   * CENA 3 — a inundação. A tela lota.
   *
   * Nada aqui é tween: a cena inteira é uma simulação. Os números que
   * sobraram descrevem física, não movimento — e é por isso que este bloco
   * não tem `duration`, `ease` nem `stagger` como os outros.
   */
  mural: {
    /**
     * A CHUVA DE ADESIVOS.
     *
     * A tela não se preenche por revelação escalonada — os adesivos caem e
     * empilham. Ver `physics/stickerDrop.js` para o porquê de cada escolha.
     */
    drop: {
      seed: 'chuva-teze-2026',

      /** Quanto tempo da timeline a cena ocupa. */
      duration: 1.55,
      /**
       * Quanto tempo de SIMULAÇÃO cabe nesse trecho. Maior que `duration`
       * acelera a queda sem aumentar a gravidade — o que manteria a pilha
       * estável mas faria os adesivos parecerem leves demais.
       */
      simDuration: 2.35,

      gravity: 1.5,
      friction: 0.62,
      frictionAir: 0.012,
      /**
       * Rotação TRAVADA (`inverseInertia = 0`).
       *
       * Medido: inércia alta mas finita não resolve — na segunda metade da
       * queda, quando a pilha entra em contato, o giro volta a acumular e
       * metade das peças acaba de cabeça para baixo. Com tipografia isso não
       * lê como colagem, lê como defeito.
       *
       * A variedade de ângulos não se perde: ela já está no ângulo de
       * projeto de cada peça, e um assentamento de poucos graus é devolvido
       * na entrega (`settleTilt`).
       */
      rotationInertia: 0,
      /** Acomodação final, em graus: a vida que a rotação travada tirou. */
      settleTilt: 3.5,

      /**
       * O colisor é MENOR que o desenho. É o parâmetro que decide se a
       * parede fica densa (peças se sobrepondo) ou cheia de frestas (peças
       * apenas encostadas). Abaixo de ~0,5 a pilha desmorona.
       */
      colliderScale: 0.6,

      /** Onde e quando cada adesivo nasce. */
      spawnHeight: 2.6, // múltiplos da própria altura, acima do quadro
      spawnJitterX: 0.14, // fração da largura do palco
      spawnWindow: 0.35, // dispersão aleatória do instante de soltura, em s
      spawnStagger: 0.009, // avanço por peça, em s
      /** As peças narrativas caem depois, para pousar POR CIMA da pilha. */
      narrativeDelay: 0.55,

      /** Sangramento das bordas: a pilha continua além do quadro. */
      floorBleed: 26,
      wallBleed: 40,

      /** Estabilidade x custo. */
      positionIterations: 6,
      velocityIterations: 4,
      sleepThreshold: 40,
    },
    /** Assentamento final: o mural inteiro respira uma vez. */
    settleDuration: 0.8,
    settleScale: 1.012,
  },

  /** CENA 4 — as pegadas atravessam a cena. */
  footsteps: {
    pressDuration: 0.24, // impacto da pegada
    stagger: 0.1, // cadencia do passo
    ease: 'tz.stamp',
    scaleFrom: 1.55,
    opacity: 0.74,
    /** A tinta seca: cada pegada apaga depois de N passos. */
    fadeDuration: 0.75, // a cauda se sobrepoe a cena 6, de proposito
    fadeAfter: 2,
    fadeEase: 'power1.inOut',
  },

  /** CENA 5 — o mural reage a passagem. */
  reaction: {
    duration: 0.8,
    ease: 'tz.flutter',
    /** Alcance da reacao, em % do palco. Fora disso a peca ignora o passo. */
    radius: 19,
    maxTilt: 4.6, // graus
    maxLift: 1.5, // unidades
    delay: 0.04, // o papel responde um instante depois do impacto
  },

  /** CENA 6 — o vento comeca.
   *  `stagger` é por peça: com ~80 peças em cena ele precisa ser pequeno,
   *  senão a varredura do vento sozinha dura mais que a cena inteira. */
  breeze: {
    duration: 0.95,
    stagger: 0.005,
    ease: 'tz.breeze',
    lift: 2.2, // unidades
    tilt: 3.4, // graus
    scale: 1.035,
    /** Direcao do vento em graus (0 = da esquerda para a direita). */
    angle: -18,
  },

  /**
   * CENA 7 — A QUEDA. Tudo desce e sai por baixo.
   *
   * Nao ha velocidade nem gravidade escritas aqui, e e de proposito: quem
   * manda e o TEMPO. A cena resolve `g = 2d/t²` com a altura real da tela,
   * entao a queda dura o mesmo em qualquer aparelho — em vez de ser lenta no
   * monitor grande e violenta no celular.
   */
  fall: {
    /** Quanto tempo um adesivo leva para atravessar o quadro inteiro. */
    duration: 1,
    /**
     * O papel e a primeira coisa a ir embora: atravessa em `duration` x isto.
     *
     * E o numero mais sensivel da cena. Quanto menor, mais o papel se
     * adianta e mais tempo os adesivos passam tombando sobre a pagina ja
     * visivel — que e a imagem que a cena quer. Perto de 1, papel e adesivos
     * descem juntos e a saida vira um bloco so.
     */
    paperRatio: 0.85,
    /**
     * A onda de soltura: quanto tempo separa o adesivo do topo do adesivo
     * do rodape. Precisa ser MENOR que a saida do papel — senao a borda do
     * papel alcanca uma peca que ainda nem se soltou, e ela fica parada no
     * ar sobre a pagina nova.
     */
    wave: 0.4,
    /** Desalinho da onda, em segundos, para os dois lados. */
    waveJitter: 0.07,
    /** Quanto o temperamento da peca (`windBias`) altera a gravidade dela. */
    weightJitter: 0.22,
    /** Empurrao no instante em que descola, em unidades por segundo. */
    release: 9,
    /** Deriva lateral: multiplica o `rotJitter` da peca (±2.4 graus). */
    drift: 1.5,
    /** Tombo durante a queda, em graus. Curto: nada aqui e revoada. */
    spin: 6,
    spinJitter: 9,
    /**
     * Quanto a pilha da cena 3 transborda acima do quadro, em fracao da
     * altura da tela. Ninguem consegue medir isso na montagem da timeline —
     * a fisica ainda nao rodou —, e e essa distancia a mais que cada peca
     * precisa andar para sair mesmo. Medido: ~0.40 no pior caso.
     */
    overshoot: 0.55,
  },

  /** CENA 8 — limpeza. A revelacao mesmo e a borda do papel descendo. */
  reveal: {
    /** Acompanha a saida do papel: `fall.duration * fall.paperRatio`. */
    duration: 0.8,
    ease: 'tz.veil',
    /** A nova pagina entra com um respiro de escala quase imperceptivel. */
    pageScaleFrom: 1.018,
    pageDuration: 0.86,
    pageEase: 'tz.settle',
  },

  /** Assinatura discreta no canto. */
  mark: {
    inDuration: 0.7,
    outDuration: 0.4,
    opacity: 0.75,
  },

  /**
   * Coreografia: onde cada cena entra na linha do tempo principal.
   * Valores negativos sobrepoem a cena anterior — e a sobreposicao que
   * transforma oito blocos em um movimento continuo.
   */
  choreography: [
    { scene: 'awaken', at: 0 },
    { scene: 'gather', at: '>-0.55' },
    { scene: 'mural', at: '>-0.78' },
    { scene: 'footsteps', at: '>-0.85' },
    // A brisa entra por cima da cauda de secagem das pegadas: o rastro
    // ainda esta desaparecendo quando o vento comeca. Duas coisas ao mesmo
    // tempo, como no mundo.
    { scene: 'breeze', at: '>-0.70' },
    { scene: 'fall', at: '>-0.75' },
    // Ancorada no INICIO da queda (`<`), e nao no fim: o grao e a vinheta
    // precisam sumir enquanto o papel desce. Preso ao fim, qualquer ajuste
    // na duracao da queda deslocaria a limpeza junto.
    { scene: 'reveal', at: '<+=0.12' },
  ],

  /**
   * Momento em que a tela esta coberta o bastante para trocar o conteudo
   * da pagina sem que ninguem perceba. Expresso como posicao na timeline.
   */
  commitLabel: 'coberto',
};

/**
 * Versao para `prefers-reduced-motion`.
 * Nao e a mesma animacao mais lenta: e outra animacao, sem deslocamento.
 */
export const MOTION_REDUCED = {
  fadeIn: 0.42,
  hold: 0.34,
  fadeOut: 0.42,
  stagger: 0.012,
  commitLabel: 'coberto',
};
