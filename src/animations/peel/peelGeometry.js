/**
 * A GEOMETRIA DO ENROLAMENTO
 *
 * Matematica pura: nao conhece DOM, nao conhece GSAP, nao mede nada. Recebe
 * um progresso e devolve, para cada faixa da figurinha, onde ela esta, quanto
 * girou e quanta luz pega. Separado justamente para que a fisica do papel
 * possa ser discutida (e corrigida) sem abrir uma linha de CSS.
 *
 * ─── O MODELO ────────────────────────────────────────────────────────────
 *
 * A figurinha e uma tira fina dividida em `slices` faixas ao longo do eixo da
 * colagem. `u` corre de 0 (a borda que encosta primeiro) a 1 (a borda solta).
 *
 * O progresso `p` e a LINHA DE CONTATO. Tudo com u < p ja esta colado e
 * deitado; o que vem depois esta no ar, enrolado.
 *
 *      p=0.35
 *   ┌────────┬──────────────────────────┐
 *   │ colado │  no ar, enrolando        │
 *   └────────┴──────────────────────────┘
 *   0       0.35                        1
 *
 * O trecho no ar nao dobra num vinco: ele CURVA. O angulo acumulado cresce
 * ao longo do que sobrou, medido em fracao do que sobrou — e por isso o rolo
 * encolhe junto com a parte solta, em vez de manter o mesmo raio ate o fim:
 *
 *     θ(u) = Θ(p) · t^bend ,  t = (u - p) / (1 - p)
 *
 * `Θ(p)` cresce com o progresso (`curl` → `curlEnd`). No comeco a figurinha
 * esta quase reta, so levantada; no fim, o pouco que sobra esta enroladinho.
 * E o que separa "papel sendo assentado" de "cartao rigido girando".
 *
 * `bend` concentra a curvatura perto da ponta: com 1 a curva e um arco de
 * circulo; acima de 1 a regiao junto a linha de contato fica mais reta e a
 * ponta enrola mais — que e como papel adesivo se comporta de verdade.
 *
 * ─── POR QUE AS FAIXAS SAO FIXAS ─────────────────────────────────────────
 *
 * Cada faixa e uma janela FIXA sobre a arte. Se elas acompanhassem a linha de
 * contato, todo quadro precisaria reescrever `background-position` e altura —
 * pintura e layout, os dois caros. Do jeito que esta, so `transform`,
 * `filter` e `opacity` mudam, e a linha de contato anda em passos do tamanho
 * de uma faixa. O passo nao aparece porque o ANGULO de cada faixa cresce de
 * forma continua a partir de zero: a forma se transforma suavemente, so a
 * dobradica e que salta — e ela salta enquanto esta reta.
 *
 * ─── O QUADRO CANONICO ───────────────────────────────────────────────────
 *
 * Toda a conta acontece num quadro unico: faixas empilhadas para baixo (+a),
 * levantando na direcao do observador (+lift). As quatro direcoes de colagem
 * sao a MESMA conta vista de outro angulo — a conversao e uma rotacao no
 * plano, feita pelo proprio CSS (ver `PeelSticker.js`).
 */

const RAD = Math.PI / 180;

/**
 * Como cada direcao ancora a figurinha.
 *
 *   eixo    'y' = faixas horizontais (cola de cima para baixo, ou o contrario)
 *           'x' = faixas verticais
 *   beta    rotacao no plano que leva o quadro canonico ao da tela
 *   origem  a dobradica da faixa, em coordenadas da propria faixa
 *   ancora  de que borda da figurinha a faixa 0 parte
 *   inverte a faixa 0 mostra a ultima banda da arte, e nao a primeira
 */
export const ANCORAS = {
  top: { eixo: 'y', beta: 0, origem: '50% 0', ancora: 'top', inverte: false },
  bottom: { eixo: 'y', beta: 180, origem: '50% 100%', ancora: 'bottom', inverte: true },
  left: { eixo: 'x', beta: -90, origem: '0 50%', ancora: 'left', inverte: false },
  right: { eixo: 'x', beta: 90, origem: '100% 50%', ancora: 'right', inverte: true },
};

/**
 * As diagonais.
 *
 * Uma colagem que comeca por um CANTO exigiria faixas diagonais, e faixa
 * diagonal nao existe: a janela de uma faixa e um recorte retangular da arte.
 * Tentar torcer a dobradica (girando o eixo de rotacao) abre fendas em V
 * entre as faixas — medido, ~11 px com 12 faixas.
 *
 * Entao a diagonal vem de outro lugar, e de graca: **a peca ja e girada na
 * composicao**. Uma figurinha com `rot: -8` colando de cima para baixo ja
 * chega na tela com a dobra inclinada. O apelido aqui escolhe a borda
 * dominante e deixa a inclinacao por conta da peca.
 */
const APELIDOS = {
  'top-left': 'top',
  'top-right': 'top',
  'bottom-left': 'bottom',
  'bottom-right': 'bottom',
};

export function resolverAncora(direcao = 'top') {
  return ANCORAS[APELIDOS[direcao] ?? direcao] ?? ANCORAS.top;
}

/** Valores de partida — todos sobrescritiveis por figurinha. */
export const PADRAO = {
  /** Numero de faixas. Mais faixas = curva mais lisa e mais camadas. */
  slices: 14,
  /**
   * Angulo total do enrolamento no inicio (graus).
   *
   * Este numero e a diferenca entre COLAR e DESCOLAR.
   *
   * Passando bem de 90 a ponta tomba para tras e cobre o que ja esta colado:
   * e o gesto de arrancar um adesivo, e visto de frente ele vira uma tabua
   * cinza deitada sobre a arte — o verso ocupa metade da silhueta e a curva
   * some dentro do proprio encurtamento.
   *
   * Perto de 80 a figurinha fica ERGUIDA, apoiada na linha de contato, com a
   * estampa virada para quem olha: e a mao segurando o adesivo antes de
   * assentar. O verso so aparece no fim, numa lasquinha, quando o que sobrou
   * e curto o bastante para enrolar de verdade.
   */
  curl: 82,
  /** …e no fim, quando so resta uma lasquinha para assentar. */
  curlEnd: 138,
  /**
   * Concentracao da curvatura na ponta. 1 = arco de circulo.
   *
   * Acima de ~1.4 a figurinha vira dobradica: um trecho reto, um vinco, e
   * uma tabua enrolada. Papel adesivo curva desde o comeco — so curva MAIS
   * perto da ponta, que e o que 1.2 descreve.
   */
  bend: 1.15,
  /**
   * Direcao da luz: a inclinacao de superficie que recebe mais luz.
   *
   * Perto de 20 graus a face que acabou de levantar ganha um realce curto
   * (o brilho que corre junto com a dobra) e o resto da curva escurece
   * progressivamente ate o vinco. Valores altos jogam o pico para o meio da
   * curva e achatam tudo: o enrolamento fica com um cinza so.
   */
  lightAngle: 22,
  /** Amplitude do sombreado. Papel e fosco — mas fosco nao e chapado. */
  lightGain: 0.55,
  /** Piso do sombreado: papel no contraluz ainda recebe luz de volta. */
  lightFloor: 0.66,
  /**
   * Profundidade da perspectiva, em multiplos do eixo da colagem.
   *
   * Baixo demais e lente olho-de-peixe: a ponta levantada incha. Alto demais
   * e teleobjetiva, e a faixa longe deixa de encurtar — some a sensacao de
   * volume. Entre 2 e 3 alturas da propria figurinha e o que parece "uma
   * pessoa olhando de perto para um adesivo".
   */
  depth: 2.4,
  /** A partir de quantos graus o verso (papel siliconado) aparece. */
  linerFrom: 86,
  /** …e a partir de quantos ele cobre a arte por completo. */
  linerTo: 102,
};

/**
 * Prepara o vetor de faixas reaproveitado entre quadros.
 * Alocar 14 objetos por figurinha a cada quadro geraria lixo suficiente para
 * o coletor aparecer no meio da animacao.
 */
export function criarFaixas(slices) {
  return Array.from({ length: slices }, () => ({
    a: 0,
    lift: 0,
    angulo: 0,
    luz: 1,
    verso: 0,
  }));
}

/** O angulo acumulado na dobradica que comeca em `u`. */
function anguloEm(u, progresso, cfg) {
  if (u <= progresso) return 0;

  const restante = 1 - progresso;
  // Perto do fim `restante` tende a zero: o que sobrou esta todo na ponta da
  // curva, e portanto no angulo maximo. Sem a guarda isso vira 0/0.
  const t = restante > 1e-4 ? Math.min((u - progresso) / restante, 1) : 1;
  const total = cfg.curl + (cfg.curlEnd - cfg.curl) * progresso;

  return total * t ** cfg.bend;
}

/**
 * Resolve a cadeia inteira para um progresso.
 *
 * @param {object} cfg       configuracao ja mesclada com PADRAO
 * @param {number} progresso 0 = solta, 1 = colada
 * @param {Array} faixas     vetor de `criarFaixas`, escrito no lugar
 * @returns {{ contato: number, altura: number, ponta: number }}
 *          contato = onde esta a linha de contato (fracao do eixo)
 *          altura  = o quanto a peca mais se afasta da superficie
 *          ponta   = ate onde a figurinha alcanca sobre a superficie
 */
export function resolverCadeia(cfg, progresso, faixas) {
  const n = faixas.length;
  const passo = 1 / n;

  let a = 0;
  let lift = 0;
  let altura = 0;

  for (let i = 0; i < n; i += 1) {
    const angulo = anguloEm(i * passo, progresso, cfg);
    const faixa = faixas[i];

    faixa.a = a;
    faixa.lift = lift;
    faixa.angulo = angulo;

    // Lambert com um so termo: a faixa mais iluminada e a que aponta para a
    // luz, e a que esta deitada vale exatamente 1 — assim a figurinha colada
    // nao fica com filtro nenhum sobrando.
    // Passado o meio-giro, o que se ve e o verso do adesivo. A troca e uma
    // rampa curta em vez de um corte: a ponta ROLA, nao vira de uma vez.
    const verso =
      angulo <= cfg.linerFrom
        ? 0
        : Math.min((angulo - cfg.linerFrom) / (cfg.linerTo - cfg.linerFrom), 1);
    faixa.verso = verso;

    // A LUZ, e ela precisa saber que lado da folha esta olhando.
    //
    // O mesmo cosseno para os dois lados achataria o rolo: passado o
    // meio-giro toda faixa bateria no piso do sombreado e a ponta enrolada
    // viraria uma tabua cinza de um tom so. A face de tras tem a normal
    // invertida — e a que, virada para cima no fim do giro, e a mais clara
    // de todas.
    //
    // Uma so mistura, pesada pelo mesmo `verso`: na regiao em que as duas
    // contas discordam a faixa esta de perfil, invisivel.
    const rad = angulo * RAD;
    const luz = cfg.lightAngle * RAD;
    const base = Math.cos(luz);
    const frente = 1 + cfg.lightGain * (Math.cos(rad - luz) - base);
    const dorso = 1 + cfg.lightGain * (-Math.cos(rad - luz) - base);
    const lambert = frente + (dorso - frente) * verso;

    // O piso importa: papel de verdade nunca fica preto — ele recebe a luz
    // que volta da propria superficie logo abaixo.
    faixa.luz = lambert < cfg.lightFloor ? cfg.lightFloor : lambert;

    a += passo * Math.cos(rad);
    lift += passo * Math.sin(rad);
    if (lift > altura) altura = lift;
  }

  return { contato: progresso, altura, ponta: a };
}
