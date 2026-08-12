/**
 * Gerador da camada de preenchimento.
 *
 * Devolve entradas com exatamente o mesmo formato dos objetos escritos à
 * mão em `COLLAGE` — assim elas passam pelo mesmo `createCollagePiece`,
 * pelas mesmas cenas e pelo mesmo sistema de vento. Nada no resto do
 * projeto precisa saber que estas peças foram geradas.
 *
 * Duas sub-camadas, com funções diferentes:
 *
 *   BASE     fitas e retalhos grandes sobre uma grade desalinhada. É quem
 *            fecha a tela — depois dela não sobra fundo à vista.
 *   ACENTOS  selos, carimbos e desenhos pequenos espalhados por cima.
 *            É o que faz a parede parecer acumulada, e não estampada.
 *
 * A semente é fixa: a "bagunça" é sempre a mesma e, portanto, ajustável
 * pelo olho — que é a única forma de julgar uma colagem.
 */

import { createJitter } from '../utils/math.js';

/**
 * Todo adesivo do preenchimento entra POR BAIXO, sem exceção.
 *
 * Misturar direções aqui foi um erro na primeira versão: com peças descendo
 * do topo ao mesmo tempo, a leitura deixa de ser "a parede está enchendo de
 * baixo" e vira "apareceram peças". A maré só existe se todas subirem.
 */
const ENTRADA = 'down';
const SAIDAS = ['left', 'right', 'up'];

/** Largura sorteada dentro da escala natural do asset. */
function larguraDe(fill, asset, jitter, escala) {
  const [min, max] = fill.sizes[asset] ?? [12, 22];
  return +(jitter.range(min, max) * escala).toFixed(2);
}

function criarEntrada({ id, asset, x, y, w, fill, jitter, depth, peel }) {
  return {
    id,
    asset,
    // Toda a camada entra no ato 3: é ela que produz a inundação.
    act: 3,
    isFill: true,
    // Em aparelho modesto o preenchimento não descola — as peças narrativas
    // continuam colando, e é nelas que o gesto realmente se lê.
    noPeel: !peel,
    x: +x.toFixed(2),
    y: +y.toFixed(2),
    w,
    layer: 'back',
    blend: fill.blendPool.includes(asset),
    // z-index baixo e cíclico: a ordem entre as peças de fundo não importa,
    // só que todas fiquem abaixo das peças narrativas.
    depth,
    from: ENTRADA,
    // O fundo quase não reage às pegadas: são camadas coladas.
    reactive: jitter.range(0, 0.4),
    windBias: jitter.range(0.7, 1.5),
    exit: jitter.pick(SAIDAS),
  };
}

/**
 * @param {object} fill  bloco FILL de collage.config.js
 * @param {{ portrait: boolean }} contexto
 * @returns {object[]} entradas no formato de COLLAGE
 */
export function generateFillPieces(fill, { portrait, tier = 'alta' }) {
  const jitter = createJitter(`${fill.seed}-${portrait ? 'retrato' : 'paisagem'}`);
  const escala = portrait ? fill.portraitScale : 1;
  const orcamento = fill.tiers[tier] ?? fill.tiers.alta;
  const entries = [];

  // ── BASE ───────────────────────────────────────────────────────────────
  const base = fill.base;
  // Em retrato a grade é mais alta que larga; o orçamento do aparelho
  // continua valendo como teto.
  const cols = Math.min(portrait ? base.portrait.cols : base.cols, orcamento.cols);
  const rows = Math.min(portrait ? base.portrait.rows : base.rows, orcamento.rows + 2);

  const cellW = (100 + fill.bleed * 2) / cols;
  const cellH = (100 + fill.bleed * 2) / rows;

  for (let pass = 0; pass < base.passes; pass += 1) {
    // A segunda passada nasce meia célula deslocada nos dois eixos.
    const shiftX = pass * cellW * 0.5;
    const shiftY = pass * cellH * 0.5;

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const asset = jitter.pick(base.pool);
        entries.push(
          criarEntrada({
            id: `base-${pass}-${row}-${col}`,
            asset,
            x: -fill.bleed + shiftX + col * cellW + cellW / 2 + jitter.spread(cellW * base.scatter),
            y: -fill.bleed + shiftY + row * cellH + cellH / 2 + jitter.spread(cellH * base.scatter),
            w: larguraDe(fill, asset, jitter, escala),
            fill,
            jitter,
            peel: orcamento.peel,
            depth: 1 + ((row + col + pass) % 4),
          }),
        );
        // A rotação é sorteada aqui para respeitar o limite da sub-camada.
        entries[entries.length - 1].rot = +jitter.spread(base.maxRotation).toFixed(2);
      }
    }
  }

  // ── ACENTOS ────────────────────────────────────────────────────────────
  const accent = fill.accent;
  const total = Math.min(portrait ? accent.portraitCount : accent.count, orcamento.accent);

  for (let i = 0; i < total; i += 1) {
    const asset = jitter.pick(accent.pool);
    entries.push(
      criarEntrada({
        id: `acento-${i}`,
        asset,
        x: jitter.range(-fill.bleed * 0.6, 100 + fill.bleed * 0.6),
        y: jitter.range(-fill.bleed * 0.6, 100 + fill.bleed * 0.6),
        w: larguraDe(fill, asset, jitter, escala),
        fill,
        jitter,
        peel: orcamento.peel,
        // Acima da base, abaixo das peças narrativas.
        depth: 6 + (i % 3),
      }),
    );
    entries[entries.length - 1].rot = +jitter.spread(accent.maxRotation).toFixed(2);
  }

  return entries;
}
