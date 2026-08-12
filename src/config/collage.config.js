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
 * │ blend      true = tinta sobre o papel (multiply, sem sombra)
 * │ from       'up' | 'down' | 'left' | 'right' | 'settle' — sabor da entrada
 * │ reactive   0..1.6 — o quanto estremece quando uma pegada passa perto
 * │ windBias   0..1.8 — a pressa com que parte no vento
 * │ exit       'left' | 'right' | 'up' — para onde sai
 * │ rarity     1 = sempre presente; < 1 = probabilidade de aparecer
 * │ portrait   sobrescreve x/y/w/rot em telas verticais
 * │ hidePortrait  remove a peca em telas verticais
 * └────────────────────────────────────────────────────────────────────────
 *
 * SOBRE O MASCOTE: a pata quase nunca aparece. A marca dela na cena sao as
 * pegadas — ela ja passou. O adesivo so entra em uma fracao das execucoes
 * (`rarity`), meio escondido atras de outra peca, e e sempre o primeiro a
 * partir quando o vento comeca. Encontra-la e recompensa, nao rotina.
 */

export const COLLAGE = [
  // ── ATO 1 — silencio visual ────────────────────────────────────────────
  {
    id: 'nota-central',
    asset: 'nota-teze',
    act: 1,
    x: 46,
    y: 44,
    w: 33,
    rot: -2.5,
    layer: 'mid',
    from: 'settle',
    reactive: 0.7,
    windBias: 0.75,
    exit: 'right',
    portrait: { x: 50, y: 42, w: 62 },
  },
  {
    id: 'fita-topo',
    asset: 'fita-vichy',
    act: 1,
    x: 44,
    y: 24,
    w: 26,
    rot: -3,
    layer: 'front',
    from: 'up',
    reactive: 0.5,
    windBias: 1.25,
    exit: 'right',
    portrait: { x: 46, y: 20, w: 52 },
  },
  {
    id: 'carimbo-centro',
    asset: 'carimbo-paris',
    act: 1,
    x: 67,
    y: 60,
    w: 14,
    rot: 9,
    layer: 'front',
    blend: true,
    from: 'settle',
    reactive: 0.9,
    windBias: 0.6,
    exit: 'right',
    portrait: { x: 72, y: 56, w: 26 },
  },

  // ── ATO 2 — a colagem ganha corpo ──────────────────────────────────────
  {
    id: 'recibo-esquerda',
    asset: 'recibo',
    act: 2,
    x: 15,
    y: 47,
    w: 14,
    rot: -8,
    layer: 'front',
    from: 'left',
    reactive: 1.2,
    windBias: 1.35,
    exit: 'left',
    portrait: { x: 17, y: 66, w: 28 },
  },
  {
    id: 'bilhete',
    asset: 'bilhete-embarque',
    act: 2,
    x: 79,
    y: 32,
    w: 32,
    rot: 4.5,
    layer: 'mid',
    from: 'right',
    reactive: 0.8,
    windBias: 1.1,
    exit: 'right',
    portrait: { x: 50, y: 78, w: 50, rot: 6 },
  },
  {
    id: 'polaroid',
    asset: 'polaroid',
    act: 2,
    x: 25,
    y: 74,
    w: 21,
    rot: 6,
    layer: 'front',
    from: 'down',
    reactive: 1.4,
    windBias: 0.85,
    exit: 'left',
    portrait: { x: 30, y: 20, w: 38, rot: -5 },
  },
  {
    id: 'taca-baixo',
    asset: 'taca',
    act: 2,
    x: 71,
    y: 84,
    w: 9.5,
    rot: -5,
    layer: 'mid',
    blend: true,
    from: 'up',
    reactive: 1.5,
    windBias: 1.05,
    exit: 'right',
    portrait: { x: 78, y: 36, w: 17 },
  },
  {
    id: 'garrafa',
    asset: 'garrafa',
    act: 2,
    x: 35,
    y: 20,
    w: 9,
    rot: 3,
    layer: 'mid',
    blend: true,
    from: 'up',
    reactive: 0.6,
    windBias: 0.9,
    exit: 'left',
    portrait: { x: 24, y: 34, w: 18 },
  },
  {
    id: 'passaporte',
    asset: 'passaporte-selo',
    act: 2,
    x: 57,
    y: 13,
    w: 19,
    rot: -10,
    layer: 'back',
    blend: true,
    from: 'settle',
    reactive: 0.4,
    windBias: 0.5,
    exit: 'up',
    portrait: { x: 62, y: 10, w: 38 },
  },
  {
    id: 'etiqueta',
    asset: 'etiqueta',
    act: 2,
    x: 85,
    y: 72,
    w: 23,
    rot: 8,
    layer: 'front',
    from: 'right',
    reactive: 1.1,
    windBias: 1.3,
    exit: 'right',
    portrait: { x: 60, y: 92, w: 38 },
  },
  {
    id: 'eiffel',
    asset: 'eiffel',
    act: 2,
    x: 11,
    y: 22,
    w: 11,
    rot: -4,
    layer: 'back',
    blend: true,
    from: 'up',
    reactive: 0.3,
    windBias: 0.55,
    exit: 'left',
    hidePortrait: true,
  },
  {
    id: 'retalho-baixo',
    asset: 'retalho-vichy',
    act: 2,
    x: 47,
    y: 89,
    w: 13,
    rot: 11,
    layer: 'mid',
    from: 'down',
    reactive: 1.3,
    windBias: 1.15,
    exit: 'left',
    portrait: { x: 22, y: 88, w: 26 },
  },
  {
    id: 'selo-meio',
    asset: 'selo-postal',
    act: 2,
    x: 30,
    y: 63,
    w: 11,
    rot: -7,
    layer: 'front',
    from: 'settle',
    reactive: 1.5,
    windBias: 1.4,
    exit: 'left',
    portrait: { x: 26, y: 55, w: 22 },
  },

  // ── ATO 3 — o mural fecha as bordas ────────────────────────────────────
  {
    id: 'fita-azul-esq',
    asset: 'fita-azul',
    act: 3,
    x: 4,
    y: 48,
    w: 17,
    rot: -76,
    layer: 'front',
    from: 'left',
    reactive: 0.2,
    windBias: 1.5,
    exit: 'left',
    hidePortrait: true,
  },
  {
    id: 'fita-azul-dir',
    asset: 'fita-azul',
    act: 3,
    x: 96,
    y: 30,
    w: 15,
    rot: 80,
    layer: 'front',
    from: 'right',
    reactive: 0.2,
    windBias: 1.5,
    exit: 'right',
    portrait: { x: 96, y: 46, w: 30 },
  },
  {
    id: 'fita-rodape-esq',
    asset: 'fita-vichy',
    act: 3,
    x: 11,
    y: 95,
    w: 24,
    rot: 5,
    layer: 'front',
    from: 'down',
    reactive: 0.4,
    windBias: 1.45,
    exit: 'left',
    portrait: { x: 14, y: 97, w: 44 },
  },
  {
    id: 'fita-rodape-dir',
    asset: 'fita-vichy',
    act: 3,
    x: 89,
    y: 91,
    w: 21,
    rot: -7,
    layer: 'front',
    from: 'down',
    reactive: 0.4,
    windBias: 1.4,
    exit: 'right',
    hidePortrait: true,
  },
  {
    id: 'cartao-postal',
    asset: 'cartao-postal',
    act: 3,
    x: 73,
    y: 50,
    w: 27,
    rot: -5,
    layer: 'mid',
    from: 'right',
    reactive: 0.9,
    windBias: 0.95,
    exit: 'right',
    portrait: { x: 52, y: 58, w: 46 },
  },
  {
    id: 'tira-declaracao',
    asset: 'tira-rasgada',
    act: 3,
    x: 28,
    y: 56,
    w: 28,
    rot: 2.5,
    layer: 'front',
    from: 'left',
    reactive: 1,
    windBias: 1.2,
    exit: 'left',
    portrait: { x: 44, y: 48, w: 54 },
  },
  {
    id: 'chapeu',
    asset: 'chapeu',
    act: 3,
    x: 19,
    y: 8,
    w: 15,
    rot: -12,
    layer: 'mid',
    blend: true,
    tint: 'palha',
    from: 'up',
    reactive: 0.5,
    windBias: 0.8,
    exit: 'left',
    portrait: { x: 20, y: 8, w: 30 },
  },
  {
    id: 'scarpins',
    asset: 'scarpins',
    act: 3,
    x: 91,
    y: 57,
    w: 13,
    rot: 12,
    layer: 'mid',
    blend: true,
    from: 'right',
    reactive: 1.2,
    windBias: 0.7,
    exit: 'right',
    hidePortrait: true,
  },
  {
    id: 'buque',
    asset: 'buque',
    act: 3,
    x: 6,
    y: 79,
    w: 15,
    rot: -9,
    layer: 'mid',
    blend: true,
    from: 'left',
    reactive: 0.8,
    windBias: 0.65,
    exit: 'left',
    portrait: { x: 8, y: 74, w: 30 },
  },
  {
    id: 'marca',
    asset: 'marca-teze',
    act: 3,
    x: 53,
    y: 68,
    w: 22,
    rot: -2,
    layer: 'front',
    from: 'settle',
    reactive: 0.6,
    windBias: 0.35, // a marca resiste mais ao vento: e a ultima a partir
    exit: 'up',
    portrait: { x: 44, y: 66, w: 40 },
  },
  {
    id: 'selo-canto',
    asset: 'selo-postal',
    act: 3,
    x: 93,
    y: 9,
    w: 9,
    rot: 15,
    layer: 'front',
    from: 'up',
    reactive: 0.7,
    windBias: 1.5,
    exit: 'right',
    portrait: { x: 82, y: 26, w: 16 },
  },
  {
    id: 'carimbo-topo',
    asset: 'carimbo-paris',
    act: 3,
    x: 40,
    y: 5,
    w: 12,
    rot: -15,
    layer: 'back',
    blend: true,
    from: 'settle',
    reactive: 0.3,
    windBias: 0.45,
    exit: 'up',
    hidePortrait: true,
  },
  {
    id: 'recibo-rodape',
    asset: 'recibo',
    act: 3,
    x: 66,
    y: 93,
    w: 11,
    rot: 7,
    layer: 'mid',
    from: 'down',
    reactive: 1.1,
    windBias: 1.25,
    exit: 'right',
    hidePortrait: true,
  },
  {
    id: 'taca-canto',
    asset: 'taca',
    act: 3,
    x: 86,
    y: 15,
    w: 8,
    rot: 6,
    layer: 'back',
    blend: true,
    from: 'up',
    reactive: 0.5,
    windBias: 1,
    exit: 'right',
    hidePortrait: true,
  },

  // Pecas de preenchimento: fecham os vazios que sobram entre as pecas
  // "narrativas" e dao ao mural a densidade de coisa acumulada com o tempo.
  {
    id: 'retalho-topo',
    asset: 'retalho-vichy',
    act: 3,
    x: 68,
    y: 19,
    w: 10,
    rot: -18,
    layer: 'back',
    from: 'up',
    reactive: 0.4,
    windBias: 1.2,
    exit: 'right',
    hidePortrait: true,
  },
  {
    id: 'carimbo-esquerda',
    asset: 'carimbo-paris',
    act: 3,
    x: 22,
    y: 37,
    w: 10,
    rot: 21,
    layer: 'back',
    blend: true,
    from: 'settle',
    reactive: 0.4,
    windBias: 0.5,
    exit: 'left',
    hidePortrait: true,
  },
  {
    id: 'fita-azul-baixo',
    asset: 'fita-azul',
    act: 3,
    x: 52,
    y: 97,
    w: 14,
    rot: 4,
    layer: 'front',
    from: 'down',
    reactive: 0.3,
    windBias: 1.45,
    exit: 'left',
    hidePortrait: true,
  },

  // ── A visita rara ──────────────────────────────────────────────────────
  {
    id: 'mascote',
    asset: 'mascote-recortado',
    act: 3,
    x: 79,
    y: 79,
    w: 17,
    rot: 3.5,
    layer: 'front',
    from: 'down',
    reactive: 0.9,
    windBias: 1.7, // sai primeiro, como quem tinha mesmo que ir
    exit: 'right',
    rarity: 0.22,
    portrait: { x: 76, y: 72, w: 34 },
  },
];

/**
 * TRAJETORIA DAS PEGADAS
 *
 * Uma Bezier quadratica: o ponto de controle e o que deixa o caminho
 * "levemente torto". Reta seria mecanico; torto demais seria comico.
 */
/**
 * CAMADA DE PREENCHIMENTO
 *
 * A composição acima é desenhada à mão: cada peça foi colocada onde faz
 * sentido narrativo. Ela sozinha, porém, deixa papel aparecendo — e a
 * referência pede o oposto: a tela **lotada**, sem nenhum fundo visível,
 * como uma parede tomada por adesivos ao longo de anos.
 *
 * Resolver isso à mão seria escrever cem objetos e mantê-los. Em vez disso,
 * esta camada é gerada sobre uma grade com desalinhamento controlado — o
 * suficiente para nunca parecer grade, denso o suficiente para não sobrar
 * buraco. A semente é fixa: a "bagunça" é sempre a mesma, e portanto
 * ajustável pelo olho.
 *
 * As peças de preenchimento ficam ATRÁS das peças narrativas e não projetam
 * sombra — em uma parede lotada ninguém vê a sombra de cada adesivo, e
 * oitenta filtros de sombra custariam caro à GPU sem nada em troca.
 */
export const FILL = {
  seed: 'mural-teze-2026',

  /**
   * Orçamento de densidade por capacidade do aparelho (ver
   * `utils/deviceTier.js`). Cada peça em cena é um recálculo de estilo por
   * quadro — em um celular intermediário a densidade máxima engasga, e em
   * um desktop ela é justamente o que faz a animação.
   *
   * `peel: false` desliga o efeito de colagem apenas nas peças geradas; as
   * narrativas continuam colando, porque são poucas e grandes — é nelas que
   * o gesto se vê.
   */
  tiers: {
    alta: { cols: 7, rows: 5, accent: 42, peel: true },
    media: { cols: 6, rows: 4, accent: 26, peel: true },
    baixa: { cols: 5, rows: 4, accent: 12, peel: false },
  },

  /** Transbordo além da tela, em %: as bordas precisam ficar cortadas. */
  bleed: 10,

  /** Assets que entram em `multiply` (tinta sobre o papel, sem recorte). */
  blendPool: ['carimbo-paris', 'passaporte-selo', 'taca', 'garrafa', 'eiffel', 'scarpins', 'buque'],

  /**
   * BASE — quem realmente cobre a tela.
   *
   * Só peças que funcionam grandes e repetidas: fitas, retalhos de vichy,
   * etiquetas. Distribuídas sobre uma grade com desalinhamento, em duas
   * passadas — a segunda deslocada em meia célula, para que todo vão da
   * primeira caia sob uma peça da segunda. É esta camada que garante
   * "nenhum pixel de fundo à vista".
   */
  base: {
    cols: 7,
    rows: 5,
    passes: 2,
    /** Escape do centro da célula (0–1). Alto reabre buracos; baixo
     *  deixa a grade aparecer. */
    scatter: 0.32,
    maxRotation: 24,
    pool: [
      'fita-vichy',
      'fita-vichy',
      'fita-vichy',
      'fita-vichy',
      'fita-vichy',
      'fita-azul',
      'fita-azul',
      'fita-azul',
      'retalho-vichy',
      'retalho-vichy',
      'retalho-vichy',
      'retalho-vichy',
      'retalho-vichy',
      'etiqueta',
      // A assinatura aparece pouco mesmo na parede: repetida, deixa de ser
      // assinatura e vira padrão de fundo.
      'marca-teze',
    ],
    portrait: { cols: 4, rows: 7 },
  },

  /**
   * ACENTOS — o detalhe por cima.
   *
   * Selos, carimbos e desenhos a tinta, sempre pequenos. São eles que dão
   * à parede o ar de coisa acumulada; grandes, virariam manchas e roubariam
   * a leitura das peças narrativas.
   */
  accent: {
    count: 42,
    portraitCount: 32,
    maxRotation: 32,
    pool: [
      'selo-postal',
      'selo-postal',
      'selo-postal',
      'carimbo-paris',
      'carimbo-paris',
      'carimbo-paris',
      'passaporte-selo',
      'passaporte-selo',
      'taca',
      'garrafa',
      'eiffel',
      'chapeu',
      'scarpins',
      'buque',
    ],
  },

  /**
   * Escala natural de cada asset, em `--tz-unit` — [mínimo, máximo].
   *
   * Sem isto o gerador trata um carimbo circular e uma fita de dois palmos
   * como a mesma coisa, e o carimbo vira um disco gigante no meio da tela.
   * Cada peça tem o tamanho em que foi desenhada para ser lida.
   */
  sizes: {
    'fita-vichy': [24, 40],
    'fita-azul': [18, 32],
    'retalho-vichy': [13, 23],
    etiqueta: [17, 26],
    'marca-teze': [17, 27],
    'selo-postal': [8, 13],
    'carimbo-paris': [8, 13],
    'passaporte-selo': [11, 18],
    taca: [6, 10],
    garrafa: [6, 10],
    eiffel: [8, 13],
    chapeu: [10, 16],
    scarpins: [8, 13],
    buque: [10, 16],
  },

  /** Retrato tem menos largura por peça: tudo cresce em relação ao vmin. */
  portraitScale: 1.75,
};

export const TRAIL = {
  from: { x: -8, y: 88 },
  control: { x: 40, y: 56 },
  to: { x: 110, y: 42 },
  /** Largura de cada pegada, em `--tz-unit`. Discreta de proposito: e um
   *  rastro, nao um carimbo de destaque. */
  size: 3.4,
  /** Afastamento lateral entre pe esquerdo e direito. */
  stride: 2.4,
  /** Variacao angular por passo, em graus. */
  wobble: 9,
  /**
   * Correcao de orientacao. Na arte, os dedos da pegada apontam para BAIXO
   * (sul = +90° no sistema de tela, com y crescendo para baixo), enquanto a
   * tangente da curva e medida a partir do leste. Subtrair 90° faz os dedos
   * apontarem para onde a pata estava indo.
   */
  headingOffset: -90,

  portrait: {
    from: { x: -10, y: 92 },
    control: { x: 48, y: 62 },
    to: { x: 112, y: 28 },
    size: 6.4,
    stride: 4,
  },
};
