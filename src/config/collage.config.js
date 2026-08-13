/**
 * COMPOSICAO DA COLAGEM — o arquivo de direcao de arte.
 *
 * Cada objeto abaixo e uma peca de papel sobre o mural. Nenhuma posicao e
 * calculada em tempo de execucao: a colagem e desenhada aqui, a mao, para
 * que possa ser julgada e corrigida com o olho.
 *
 * ┌ CAMPOS ────────────────────────────────────────────────────────────────
 * │ id         identificador unico (usado tambem para semear a variacao)
 * │ asset      chave no registro de assets
 * │ act        1 | 2 | 3 — em qual cena a peca entra
 * │ x, y       centro da peca, em % do palco
 * │ w          largura, em multiplos de `--tz-unit`
 * │ rot        rotacao final, em graus
 * │ layer      'back' | 'mid' | 'front' — profundidade e forca da sombra
 * │ peel       borda por onde a figurinha e assentada ('top', 'left', …).
 * │            Presente = a peca e COLADA (ver `PeelSticker.js`); ausente =
 * │            a peca simplesmente cai com as outras.
 * │ from       'up' | 'down' | 'left' | 'right' | 'settle' — sabor da entrada
 * │ reactive   0..1.6 — o quanto estremece quando uma pegada passa perto
 * │ windBias   0..1.8 — a pressa com que se solta na queda final
 * │ exit       'left' | 'right' | 'up' — resquicio da saida em leque; hoje a
 * │            saida e uma queda so, e o campo sobrevive como semente
 * │ rarity     1 = sempre presente; < 1 = probabilidade de aparecer
 * │ portrait   sobrescreve x/y/w/rot em telas verticais
 * │ hidePortrait  remove a peca em telas verticais
 * └────────────────────────────────────────────────────────────────────────
 *
 * ─── OS DOIS TEMPOS DA COLAGEM ───────────────────────────────────────────
 *
 * ATOS 1 e 2 sao SEIS figurinhas, e so elas: as maiores, as que carregam a
 * marca. Cada uma e assentada na superficie com o efeito de colagem — dobra,
 * perspectiva, sombra de contato, verso siliconado. Sao poucas de proposito:
 * o gesto de colar so existe se der tempo de ver.
 *
 * ATO 3 e a inundacao. Dezenas de pecas caem do topo e empilham ate cobrir a
 * tela. Nenhuma delas cola — elas chegam pela fisica.
 *
 * ─── SOBRE O MASCOTE ─────────────────────────────────────────────────────
 *
 * A pata quase nunca aparece por inteiro. A marca dela na cena sao as
 * pegadas — ela ja passou. O adesivo do mascote de boina so entra em uma
 * fracao das execucoes (`rarity`), e e sempre o primeiro a se soltar quando
 * a colagem desaba. Encontra-lo e recompensa, nao rotina.
 */

export const COLLAGE = [
  // ══ ATO 1 — as tres primeiras, com tempo entre elas ═════════════════════
  {
    id: 'quadro-teze',
    asset: 'quadro-teze',
    act: 1,
    x: 44,
    y: 43,
    w: 27,
    rot: -2.5,
    layer: 'mid',
    peel: 'top',
    from: 'settle',
    reactive: 0.7,
    windBias: 0.75,
    exit: 'right',
    portrait: { x: 50, y: 34, w: 54 },
  },
  {
    id: 'madame-zaze',
    asset: 'madame-zaze',
    act: 1,
    x: 21,
    y: 70,
    w: 30,
    rot: -6,
    layer: 'front',
    peel: 'left',
    from: 'left',
    reactive: 1.1,
    windBias: 1.2,
    exit: 'left',
    portrait: { x: 30, y: 74, w: 56 },
  },
  {
    id: 'oh-la-la',
    asset: 'oh-la-la',
    act: 1,
    x: 73,
    y: 26,
    w: 23,
    rot: 5,
    layer: 'front',
    peel: 'right',
    from: 'right',
    reactive: 1,
    windBias: 1.15,
    exit: 'right',
    portrait: { x: 68, y: 16, w: 44 },
  },

  // ══ ATO 2 — a colagem ganha corpo ══════════════════════════════════════
  {
    id: 'quadro-mascote',
    asset: 'quadro-mascote',
    act: 2,
    x: 17,
    y: 27,
    w: 23,
    rot: 4,
    layer: 'mid',
    peel: 'bottom',
    from: 'up',
    reactive: 0.6,
    windBias: 0.8,
    exit: 'left',
    portrait: { x: 24, y: 53, w: 42 },
  },
  {
    id: 'mascote-grande',
    asset: 'mascote',
    act: 2,
    x: 74,
    y: 62,
    w: 21,
    rot: -3,
    layer: 'front',
    peel: 'top',
    from: 'down',
    reactive: 0.9,
    windBias: 1.3,
    exit: 'right',
    portrait: { x: 71, y: 62, w: 40 },
  },
  {
    id: 'mascote-boina',
    asset: 'mascote-boina',
    act: 2,
    x: 47,
    y: 76,
    w: 17,
    rot: 6,
    layer: 'front',
    peel: 'left',
    from: 'down',
    reactive: 1.2,
    // Sai primeiro, como quem tinha mesmo que ir.
    windBias: 1.7,
    exit: 'right',
    rarity: 0.34,
    portrait: { x: 46, y: 88, w: 34 },
  },

  // ══ ATO 3 — a inundacao ════════════════════════════════════════════════
  // Nenhuma peca daqui cola: todas chegam caindo. O que se escreve aqui e
  // apenas onde elas MORAM — a fisica decide onde param.
  {
    id: 'nota-expressao',
    asset: 'nota-expressao',
    act: 3,
    x: 30,
    y: 18,
    w: 24,
    rot: -3,
    layer: 'mid',
    from: 'down',
    reactive: 0.8,
    windBias: 0.85,
    exit: 'left',
    portrait: { x: 32, y: 20, w: 46 },
  },
  {
    id: 'nota-sofisticada',
    asset: 'nota-sofisticada',
    act: 3,
    x: 62,
    y: 44,
    w: 24,
    rot: 2.5,
    layer: 'mid',
    from: 'right',
    reactive: 0.8,
    windBias: 0.9,
    exit: 'right',
    portrait: { x: 58, y: 44, w: 46 },
  },
  {
    id: 'bilhete-zaze',
    asset: 'bilhete-zaze',
    act: 3,
    x: 80,
    y: 34,
    w: 22,
    rot: -5,
    layer: 'mid',
    from: 'right',
    reactive: 0.9,
    windBias: 1.05,
    exit: 'right',
    portrait: { x: 70, y: 30, w: 44 },
  },
  {
    id: 'nota-original',
    asset: 'nota-original',
    act: 3,
    x: 12,
    y: 52,
    w: 20,
    rot: 6,
    layer: 'mid',
    from: 'left',
    reactive: 1,
    windBias: 1.1,
    exit: 'left',
    portrait: { x: 22, y: 62, w: 40 },
  },
  {
    id: 'nota-excesso',
    asset: 'nota-excesso',
    act: 3,
    x: 55,
    y: 88,
    w: 21,
    rot: -4,
    layer: 'mid',
    from: 'down',
    reactive: 0.7,
    windBias: 0.8,
    exit: 'left',
    hidePortrait: true,
  },
  {
    id: 'recibo',
    asset: 'recibo',
    act: 3,
    x: 8,
    y: 82,
    w: 12,
    rot: -7,
    layer: 'mid',
    from: 'down',
    reactive: 1.1,
    windBias: 1,
    exit: 'left',
    portrait: { x: 12, y: 84, w: 24 },
  },
  {
    id: 'bilhete-embarque',
    asset: 'bilhete-embarque',
    act: 3,
    x: 90,
    y: 72,
    w: 13,
    rot: 8,
    layer: 'mid',
    from: 'right',
    reactive: 1,
    windBias: 1.15,
    exit: 'right',
    portrait: { x: 84, y: 76, w: 26 },
  },
  {
    id: 'pronunciamento',
    asset: 'pronunciamento',
    act: 3,
    x: 33,
    y: 58,
    w: 15,
    rot: 3,
    layer: 'back',
    from: 'up',
    reactive: 0.5,
    windBias: 0.7,
    exit: 'left',
    hidePortrait: true,
  },
  {
    id: 'eiffel-papel',
    asset: 'eiffel-papel',
    act: 3,
    x: 66,
    y: 14,
    w: 14,
    rot: -6,
    layer: 'back',
    from: 'up',
    reactive: 0.6,
    windBias: 0.75,
    exit: 'up',
    portrait: { x: 74, y: 8, w: 26 },
  },
  {
    id: 'medalhao',
    asset: 'medalhao',
    act: 3,
    x: 88,
    y: 12,
    w: 16,
    rot: 7,
    layer: 'mid',
    from: 'up',
    reactive: 0.8,
    windBias: 1.2,
    exit: 'right',
    hidePortrait: true,
  },
  {
    id: 'taca-teze',
    asset: 'taca-teze',
    act: 3,
    x: 6,
    y: 24,
    w: 9,
    rot: -9,
    layer: 'front',
    from: 'left',
    reactive: 1.3,
    windBias: 1.35,
    exit: 'left',
    portrait: { x: 10, y: 30, w: 18 },
  },
  {
    id: 'champanhe',
    asset: 'champanhe',
    act: 3,
    x: 40,
    y: 8,
    w: 10,
    rot: 12,
    layer: 'front',
    from: 'up',
    reactive: 1.2,
    windBias: 1.4,
    exit: 'up',
    portrait: { x: 42, y: 6, w: 20 },
  },
  {
    id: 'croissant',
    asset: 'croissant',
    act: 3,
    x: 24,
    y: 40,
    w: 13,
    rot: -12,
    layer: 'front',
    from: 'left',
    reactive: 1.4,
    windBias: 1.25,
    exit: 'left',
    portrait: { x: 20, y: 42, w: 26 },
  },
  {
    id: 'oculos',
    asset: 'oculos',
    act: 3,
    x: 58,
    y: 66,
    w: 14,
    rot: -8,
    layer: 'front',
    from: 'down',
    reactive: 1.5,
    windBias: 1.3,
    exit: 'right',
    portrait: { x: 62, y: 68, w: 28 },
  },
  {
    id: 'scarpins',
    asset: 'scarpins',
    act: 3,
    x: 92,
    y: 52,
    w: 12,
    rot: 10,
    layer: 'front',
    from: 'right',
    reactive: 1.2,
    windBias: 1.2,
    exit: 'right',
    hidePortrait: true,
  },
  {
    id: 'puro-suco',
    asset: 'puro-suco',
    act: 3,
    x: 34,
    y: 92,
    w: 13,
    rot: 6,
    layer: 'front',
    from: 'down',
    reactive: 1.1,
    windBias: 1.1,
    exit: 'left',
    portrait: { x: 34, y: 94, w: 26 },
  },
  {
    id: 'bandeira',
    asset: 'bandeira',
    act: 3,
    x: 78,
    y: 90,
    w: 13,
    rot: -5,
    layer: 'front',
    from: 'down',
    reactive: 1,
    windBias: 1.05,
    exit: 'right',
    hidePortrait: true,
  },
  {
    id: 'carimbo-centro',
    asset: 'carimbo-paris',
    act: 3,
    x: 50,
    y: 56,
    w: 11,
    rot: -14,
    layer: 'mid',
    from: 'settle',
    reactive: 0.9,
    windBias: 0.65,
    exit: 'right',
    portrait: { x: 52, y: 56, w: 22 },
  },
  {
    id: 'selo-canto',
    asset: 'selo-postal',
    act: 3,
    x: 15,
    y: 8,
    w: 10,
    rot: 8,
    layer: 'mid',
    from: 'up',
    reactive: 0.7,
    windBias: 0.9,
    exit: 'up',
    portrait: { x: 16, y: 8, w: 20 },
  },
  {
    id: 'eiffel-selo',
    asset: 'eiffel',
    act: 3,
    x: 70,
    y: 80,
    w: 9,
    rot: 4,
    layer: 'mid',
    from: 'down',
    reactive: 0.9,
    windBias: 1,
    exit: 'right',
    hidePortrait: true,
  },
  {
    id: 'garrafa',
    asset: 'garrafa',
    act: 3,
    x: 4,
    y: 40,
    w: 8,
    rot: -6,
    layer: 'mid',
    from: 'left',
    reactive: 1,
    windBias: 1.1,
    exit: 'left',
    hidePortrait: true,
  },
  {
    id: 'taca-canto',
    asset: 'taca',
    act: 3,
    x: 96,
    y: 30,
    w: 7,
    rot: 9,
    layer: 'mid',
    from: 'right',
    reactive: 1.1,
    windBias: 1.15,
    exit: 'right',
    hidePortrait: true,
  },
];

/**
 * TRAJETORIAS DAS PEGADAS
 *
 * Duas patas atravessam a cena, e nao uma. A segunda entra depois — tempo
 * suficiente para a primeira ser vista como um caminho, e nao como metade de
 * um par. Cada trilha e uma Bezier quadratica: o ponto de controle e o que
 * deixa o caminho "levemente torto". Reta seria mecanico; torto demais seria
 * comico.
 *
 * As coordenadas comecam e terminam FORA do quadro de proposito: a pata nao
 * nasce nem morre na tela, ela atravessa.
 */
export const TRAIL = {
  /**
   * Largura de cada pegada, em `--tz-unit`.
   *
   * Cresceu porque a parede cresceu. O adesivo amarelo e opaco e salta contra
   * o creme do papel — mas contra cento e sessenta pecas, entre listras,
   * carimbos e bilhetes, uma pegada pequena vira mais um detalhe no meio de
   * muitos. O que se procura aqui nao e ver a pegada: e reconhecer que ALGUEM
   * PASSOU, e isso precisa de escala.
   */
  size: 8.6,
  /** Afastamento lateral entre pe esquerdo e direito — acompanha o tamanho,
   *  senao um pe pisa em cima do outro. */
  stride: 4.6,
  /** Variacao angular por passo, em graus. */
  wobble: 8,
  /**
   * Correcao de orientacao. Na arte oficial os dedos apontam para CIMA
   * (norte = -90° no sistema de tela, com y crescendo para baixo), enquanto
   * a tangente da curva e medida a partir do leste. Somar 90° faz os dedos
   * apontarem para onde a pata esta indo.
   */
  headingOffset: 90,

  /**
   * Os dois caminhos.
   *
   *   delay  quando esta trilha comeca, em segundos, contados do inicio da
   *          cena. O intervalo e o que separa "duas patas" de "uma pata com
   *          o dobro de pegadas".
   *   steps  quantos passos ate atravessar.
   */
  paths: [
    // Da esquerda, descendo para o rodape.
    {
      id: 'esquerda',
      delay: 0,
      steps: 9,
      from: { x: -8, y: 34 },
      control: { x: 16, y: 62 },
      to: { x: 36, y: 110 },
      portrait: { from: { x: -10, y: 26 }, control: { x: 20, y: 58 }, to: { x: 42, y: 112 } },
    },
    // Do topo, saindo pela direita. O ponto de controle fica a ESQUERDA da
    // reta: a pata desce encostando no miolo da cena antes de sair — sem
    // isso ela raspa a borda e o caminho vira um detalhe de canto.
    {
      id: 'direita',
      delay: 0.95,
      steps: 8,
      from: { x: 80, y: -8 },
      control: { x: 76, y: 28 },
      to: { x: 108, y: 56 },
      portrait: { from: { x: 74, y: -8 }, control: { x: 70, y: 32 }, to: { x: 112, y: 66 } },
    },
  ],

  portrait: {
    size: 13.5,
    stride: 6.8,
  },
};

/**
 * CAMADA DE PREENCHIMENTO
 *
 * A composicao acima e desenhada a mao: cada peca foi colocada onde faz
 * sentido narrativo. Ela sozinha, porem, deixa papel aparecendo — e a
 * referencia pede o oposto: a tela **lotada**, sem nenhum fundo visivel,
 * como uma parede tomada por adesivos ao longo de anos.
 *
 * Resolver isso a mao seria escrever cem objetos e mante-los. Em vez disso,
 * esta camada e gerada sobre uma grade com desalinhamento controlado — o
 * suficiente para nunca parecer grade, denso o suficiente para nao sobrar
 * buraco. A semente e fixa: a "bagunca" e sempre a mesma, e portanto
 * ajustavel pelo olho.
 *
 * As pecas de preenchimento ficam ATRAS das narrativas e nao projetam
 * sombra — em uma parede lotada ninguem ve a sombra de cada adesivo, e
 * oitenta filtros de sombra custariam caro a GPU sem nada em troca.
 */
export const FILL = {
  seed: 'mural-teze-2026',

  /**
   * Orcamento de densidade por capacidade do aparelho (ver
   * `utils/deviceTier.js`). Cada peca em cena e um recalculo de estilo por
   * quadro — em um celular intermediario a densidade maxima engasga, e em
   * um desktop ela e justamente o que faz a animacao.
   */
  tiers: {
    alta: { cols: 8, rows: 5, accent: 54 },
    media: { cols: 6, rows: 4, accent: 30 },
    baixa: { cols: 5, rows: 4, accent: 16 },
  },

  /**
   * Transbordo alem da tela, em %: as bordas precisam ficar cortadas.
   *
   * E tambem o que enche as margens. A grade comeca em `-bleed` e termina em
   * `100 + bleed`; com pouco transbordo, a primeira e a ultima coluna caem
   * dentro do quadro e sobra uma faixa rala colada em cada borda.
   */
  bleed: 14,

  /**
   * BASE — quem realmente cobre a tela.
   *
   * So pecas que funcionam grandes e repetidas: as padronagens (xadrez e
   * listras) e os dois quadros de moldura. Distribuidas sobre uma grade com
   * desalinhamento, em duas passadas — a segunda deslocada em meia celula,
   * para que todo vao da primeira caia sob uma peca da segunda. E esta
   * camada que garante "nenhum pixel de fundo a vista".
   */
  base: {
    /**
     * Oito colunas, e nao sete: a variedade custou cobertura. Trocar
     * padronagem por desenho encheu a parede de peca pequena, e peca pequena
     * deixa vao — a grade precisou de mais uma coluna para fechar de novo.
     */
    cols: 8,
    rows: 5,
    passes: 2,
    /** Escape do centro da celula (0–1). Alto reabre buracos; baixo
     *  deixa a grade aparecer. */
    scatter: 0.32,
    maxRotation: 24,
    /**
     * A PADRONAGEM E FUNDO, NAO CONTEUDO.
     *
     * Primeira versao: o sorteio era so xadrez e listra, e a parede virou
     * papel de parede — a arte da marca sumia dentro da propria repeticao.
     * Aqui elas ocupam menos de um terco do sorteio, e o resto e desenho.
     *
     * Cada peca aparece ~3 vezes na parede (70 pecas / 20 casas). E o
     * limite: acima disso um bilhete com texto legivel le como documento
     * duplicado — um erro —, e abaixo disso sobra buraco.
     */
    pool: [
      // Fundo: o que fecha os vaos entre os desenhos.
      'listras-vermelha',
      'listras-vermelha',
      'xadrez-azul',
      'xadrez-azul',
      'listras-azul',
      'listras-azul',
      // Os quadros da marca — a assinatura da parede.
      'quadro-teze',
      'quadro-teze',
      'quadro-mascote',
      'quadro-mascote',
      // Papel escrito: e o que da a parede o ar de coisa acumulada.
      'nota-expressao',
      'nota-sofisticada',
      'nota-original',
      'nota-excesso',
      'bilhete-zaze',
      'pronunciamento',
      'eiffel-papel',
      'medalhao',
      'bilhete-embarque',
      'recibo',
    ],
    portrait: { cols: 4, rows: 7 },
  },

  /**
   * ACENTOS — o detalhe por cima.
   *
   * Selos, carimbos e desenhos pequenos, sempre miudos. Sao eles que dao a
   * parede o ar de coisa acumulada; grandes, virariam manchas e roubariam a
   * leitura das pecas narrativas.
   */
  accent: {
    count: 54,
    portraitCount: 40,
    maxRotation: 32,
    /**
     * Aqui entra TUDO o que e pequeno — e quanto mais variado, melhor: sao
     * os acentos que fazem a parede parecer acumulada ao longo de anos, e
     * repeticao demais de um mesmo desenho denuncia o gerador.
     *
     * Selo e carimbo pesam mais que os outros de proposito: sao os unicos
     * que uma parede real repete a exaustao sem parecer erro.
     */
    pool: [
      'selo-postal',
      'selo-postal',
      'selo-postal',
      'carimbo-paris',
      'carimbo-paris',
      'carimbo-paris',
      'taca',
      'taca-teze',
      'garrafa',
      'champanhe',
      'eiffel',
      'croissant',
      'oculos',
      'scarpins',
      'puro-suco',
      'bandeira',
      'bandeira',
      'medalhao',
      // As frases da marca tambem se repetem na parede — pequenas, viram
      // acento; grandes, roubariam a leitura das figurinhas dos atos 1 e 2.
      'madame-zaze',
      'oh-la-la',
    ],
  },

  /**
   * Escala natural de cada asset, em `--tz-unit` — [minimo, maximo].
   *
   * Sem isto o gerador trata um carimbo circular e uma fita de dois palmos
   * como a mesma coisa, e o carimbo vira um disco gigante no meio da tela.
   * Cada peca tem o tamanho em que foi desenhada para ser lida.
   */
  sizes: {
    // As padronagens sao RETALHOS, nao paredes: grandes demais elas param de
    // parecer papel picado e viram papel de parede.
    'xadrez-azul': [22, 37],
    'listras-azul': [15, 26],
    'listras-vermelha': [15, 26],
    'quadro-teze': [14, 23],
    'quadro-mascote': [14, 23],

    // Papel escrito. Largo o bastante para cobrir, pequeno o bastante para o
    // texto virar textura — ler a mesma frase quatro vezes na parede seria
    // pior do que nao le-la nenhuma.
    'nota-expressao': [23, 34],
    'nota-sofisticada': [23, 34],
    'nota-original': [21, 31],
    'nota-excesso': [20, 30],
    'bilhete-zaze': [19, 28],
    pronunciamento: [13, 20],
    'eiffel-papel': [13, 20],

    // Miudos.
    medalhao: [10, 15],
    'selo-postal': [8, 13],
    'carimbo-paris': [8, 13],
    recibo: [7, 11],
    'bilhete-embarque': [8, 12],
    taca: [5, 8],
    garrafa: [6, 9],
    eiffel: [7, 11],
    croissant: [9, 14],
    oculos: [9, 14],
    scarpins: [8, 12],
    champanhe: [6, 10],
    'taca-teze': [6, 10],
    'puro-suco': [9, 14],
    bandeira: [9, 14],
    'madame-zaze': [11, 17],
    'oh-la-la': [10, 15],
  },

  /** Retrato: a tela e mais estreita, e as pecas precisam crescer junto. */
  portraitScale: 1.35,
};
