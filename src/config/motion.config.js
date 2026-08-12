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

  /** CENA 1 — silencio visual: as primeiras pecas pousam. */
  awaken: {
    veilDuration: 0.46,
    duration: 0.78,
    stagger: 0.11,
    ease: 'tz.settle',
    riseDistance: 14,
    riseBias: 0.85,
    rotationOffset: 7, // graus a mais na entrada, para "assentar" girando
    scaleFrom: 0.92,
    /** A primeira peça é colada devagar: dá para ver a aba assentando. */
    peel: { from: 0.88, delayRatio: 0.1, durationRatio: 0.8, ease: 'tz.settle' },
    /** Preenchimento do fio de tinta ao lado da assinatura. */
    ruleDuration: 1.2,
  },

  /** CENA 2 — a colagem ganha corpo. */
  gather: {
    duration: 0.74,
    stagger: 0.05,
    ease: 'tz.settle',
    riseDistance: 20,
    riseBias: 0.9,
    rotationOffset: 10,
    scaleFrom: 0.88,
    peel: { from: 0.85, delayRatio: 0.1, durationRatio: 0.72, ease: 'tz.stamp' },
  },

  /**
   * CENA 3 — a inundação. A tela lota.
   * `stagger` aqui é o controle mais sensível de toda a animação: é ele que
   * decide se a colagem "enche" (baixo) ou "pipoca" (alto).
   */
  mural: {
    /**
     * Curta, e esse é o número que governa o custo da cena inteira.
     *
     * Com `stagger` de 7 ms, o total de peças em movimento ao mesmo tempo é
     * `duration / stagger` — a 0,72 s eram ~100 peças animando juntas, o que
     * derrubava quadros em CPU modesta. A 0,44 s são ~60, e a leitura não
     * piora: numa inundação o gesto de cada adesivo é rápido mesmo.
     */
    duration: 0.44,
    // Com ~127 peças no ato 3, este número multiplica: cada milésimo aqui
    // vira 0,13 s de cena. É o controle mais sensível da animação inteira.
    stagger: 0.007,
    ease: 'tz.settle',
    /** Alto de propósito: é o que faz a peça SUBIR, e não só aparecer.
     *  Somado a `riseBias: 1`, cada adesivo parte de ~30 unidades abaixo do
     *  lugar dele. Mais que isso e a peça passa metade da entrada fora da
     *  tela — a subida deixa de ser vista e vira só um atraso. */
    riseDistance: 15,
    /** Todo mundo chega de baixo, inclusive quem entra pelos lados. */
    riseBias: 1,
    rotationOffset: 15,
    scaleFrom: 0.86,
    /**
     * A colagem do adesivo (ver `--tz-peel` em `preloader.css`).
     *   from          quanto do adesivo começa solto (0–1)
     *   delayRatio    quando a aba começa a assentar, em fração da entrada
     *   durationRatio quanto dura, em fração da entrada — menor que 1 para
     *                 que o adesivo termine de colar ANTES de parar de se
     *                 mover, como um polegar que assenta o papel em curso
     */
    peel: {
      from: 0.82,
      delayRatio: 0.1,
      /**
       * Curto de propósito. Com o stagger da inundação, cada décimo aqui
       * decide QUANTOS adesivos estão descolando ao mesmo tempo — e é a
       * simultaneidade, não o número total de peças, que pesa: cada aba em
       * movimento repinta o próprio `clip-path` a cada quadro.
       */
      durationRatio: 0.42,
      ease: 'tz.stamp',
    },
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
    /**
     * A dissolucao da borda de ataque do papel, em unidades. Precisa ser a
     * mesma medida da `mask-image` do veu em `preloader.css`: a cena usa esse
     * numero para decidir quais desenhos a tinta ficaram alto demais.
     */
    edgeFade: 3,
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
