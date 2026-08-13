/**
 * Pipeline de assets — `npm run assets`
 *
 * Converte a arte oficial da Tezê (src/assets/oficial) nas pecas que o
 * pre-loader consome (src/assets/collage):
 *
 *   1. renomeia         -> os arquivos chegam numerados (01.png, 23.png…) e
 *                          saem com o nome do que sao. Nenhuma outra parte do
 *                          projeto deveria precisar saber que existiu um "23";
 *   2. apara a moldura  -> a peca passa a ocupar 100% do quadro, entao `--tz-w`
 *                          na composicao significa de fato a largura visivel;
 *   3. redimensiona     -> ao teto real de exibicao (~2x do maior uso), porque
 *                          a arte original chega em ate 12500x12500 px;
 *   4. exporta WebP com alpha. TUDO aqui e recortado — nao ha mais pecas de
 *      fundo branco esperando `mix-blend-mode` para se integrar ao papel.
 *
 * Rodar de novo e seguro e idempotente. As fontes ficam versionadas em
 * `oficial/` para que a direcao de arte possa reprocessar quando quiser.
 */

import { readdir, mkdir, stat, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const HERE = dirname(fileURLToPath(import.meta.url));
const RAW_DIR = join(HERE, '..', 'src', 'assets', 'oficial');
const OUT_DIR = join(HERE, '..', 'src', 'assets', 'collage');

/**
 * Tetos de exibicao, em px do MAIOR lado.
 *
 * O numero e ~2x o maior uso previsto na composicao (para telas 2x), e nao a
 * resolucao da arte: um selo de 12 unidades nunca passa de ~200 px na tela, e
 * guardar 12500 px dele custaria mais que a animacao inteira.
 *
 * O teto vale para o maior lado, e nao so para a largura: o recibo tem
 * proporcao 2,6:1, e limitar apenas a largura deixaria um arquivo tres vezes
 * mais pesado que o de uma peca quadrada do mesmo papel na composicao.
 */
const TETO = {
  /** As seis figurinhas do peel: sao grandes e sao a primeira coisa que se ve. */
  heroi: 1000,
  /** Pecas narrativas — bilhetes, notas, recibos. Precisam ser legiveis. */
  narrativa: 720,
  /** Selos, carimbos, desenhos pequenos: aparecem miudos e repetidos. */
  miudo: 440,
  /** Retalhos de padronagem: sao textura, nao desenho — e a mais cara de
   *  comprimir (xadrez e listra sao detalhe puro), entao o teto e o menor. */
  padrao: 620,
};

/**
 * @typedef {Object} Receita
 * @property {string} nome     nome de saida (a chave usada na composicao)
 * @property {number} width    largura maxima de saida, em px
 * @property {boolean} [trim]  apara a borda transparente (padrao: true)
 * @property {number} [quality] qualidade WebP (padrao: 82)
 */

/** @type {Record<string, Receita>} */
const RECEITAS = {
  // ── As seis do peel ────────────────────────────────────────────────────
  '01': { nome: 'mascote', width: TETO.heroi, quality: 86 },
  '09': { nome: 'quadro-teze', width: TETO.heroi, quality: 86 },
  '13': { nome: 'quadro-mascote', width: TETO.heroi, quality: 86 },
  '19': { nome: 'madame-zaze', width: TETO.heroi, quality: 86 },
  '20': { nome: 'oh-la-la', width: TETO.heroi, quality: 86 },
  '23': { nome: 'mascote-boina', width: TETO.heroi, quality: 86 },

  // ── Narrativa: o que se le ─────────────────────────────────────────────
  '04': { nome: 'recibo', width: TETO.narrativa },
  '05': { nome: 'bilhete-embarque', width: TETO.narrativa },
  '07': { nome: 'nota-expressao', width: TETO.narrativa },
  '08': { nome: 'nota-sofisticada', width: TETO.narrativa },
  '10': { nome: 'bilhete-zaze', width: TETO.narrativa },
  '11': { nome: 'nota-original', width: TETO.narrativa },
  '12': { nome: 'nota-excesso', width: TETO.narrativa },
  '14': { nome: 'pronunciamento', width: TETO.narrativa },
  '15': { nome: 'eiffel-papel', width: TETO.narrativa },
  '17': { nome: 'medalhao', width: TETO.narrativa },

  // ── Miudos: o que se repete ────────────────────────────────────────────
  '02': { nome: 'garrafa', width: TETO.miudo },
  '03': { nome: 'taca', width: TETO.miudo },
  '06': { nome: 'selo-postal', width: TETO.miudo },
  '16': { nome: 'carimbo-paris', width: TETO.miudo },
  '18': { nome: 'taca-teze', width: TETO.miudo },
  '21': { nome: 'scarpins', width: TETO.miudo },
  '22': { nome: 'oculos', width: TETO.miudo },
  '24': { nome: 'champanhe', width: TETO.miudo },
  '25': { nome: 'eiffel', width: TETO.miudo },
  '26': { nome: 'croissant', width: TETO.miudo },
  '27': { nome: 'puro-suco', width: TETO.miudo },
  '28': { nome: 'bandeira', width: TETO.miudo },

  // ── Padronagem: os retalhos que fecham a tela ──────────────────────────
  LISTRAS: { nome: 'listras-azul', width: TETO.padrao },
  LISTRAS_02: { nome: 'listras-vermelha', width: TETO.padrao },
  XADREZ: { nome: 'xadrez-azul', width: TETO.padrao },

  /**
   * A textura do papel. Nao e uma peca: e o fundo do mural, repetido em
   * mosaico — e por isso e a unica que NAO pode ser aparada.
   */
  XADREZ_02: { nome: 'textura-papel', width: 900, trim: false, quality: 58 },

  /**
   * A PEGADA — a unica peca que nao vem da arte oficial.
   *
   * O rastro da pata e narrativa da animacao, nao da marca: a cartela
   * oficial nao traz uma pegada, entao esta continua sendo a desenhada para
   * o laboratorio. E tambem a unica em fundo BRANCO: ela e tinta carimbada
   * no papel, aplicada com `mix-blend-mode: multiply` pela camada do rastro
   * inteira (ver `preloader.css`), e recortar o alpha dela apagaria
   * justamente a suavidade da borda da tinta.
   */
  pegada: { nome: 'pegada', width: 260, fundo: '#ffffff', quality: 88 },
};

/** Arquivos da pasta oficial que nao viram asset. */
const IGNORAR = /PALETA/i;

const bytes = (n) => `${(n / 1024).toFixed(0)} kB`;

async function processar(arquivo, receita) {
  const origem = join(RAW_DIR, arquivo);
  const antes = (await stat(origem)).size;

  // `limitInputPixels: false`: a arte oficial chega em 12500x12500, acima do
  // teto de seguranca padrao do sharp.
  let pipeline = sharp(origem, { limitInputPixels: false });

  if (receita.trim !== false) {
    // O aparo usa a transparencia — quase tudo aqui e recorte. A excecao
    // (`fundo`) apara pela cor, para a peca que e tinta sobre papel branco.
    pipeline = pipeline.trim({
      background: receita.fundo ?? { r: 0, g: 0, b: 0, alpha: 0 },
      threshold: receita.fundo ? 14 : 1,
    });
  }

  pipeline = pipeline.resize({
    width: receita.width,
    height: receita.width,
    withoutEnlargement: true,
    fit: 'inside',
  });

  const webp = await pipeline
    .webp({ quality: receita.quality ?? 82, effort: 6, alphaQuality: 92 })
    .toBuffer();

  const destino = join(OUT_DIR, `${receita.nome}.webp`);
  await sharp(webp).toFile(destino);

  const meta = await sharp(webp).metadata();
  console.log(
    `  ${arquivo.padEnd(16)} -> ${receita.nome.padEnd(18)} ` +
      `${String(meta.width).padStart(4)}x${String(meta.height).padEnd(4)}  ` +
      `${bytes(antes)} -> ${bytes(webp.length)}`,
  );

  return { nome: receita.nome, w: meta.width, h: meta.height, peso: webp.length };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const presentes = (await readdir(RAW_DIR)).filter((f) => /\.png$/i.test(f) && !IGNORAR.test(f));

  console.log('\nProcessando a arte oficial da Tezê\n');

  const pendentes = [];
  for (const arquivo of presentes) {
    const chave = arquivo.replace(/\.png$/i, '');
    const receita = RECEITAS[chave];
    if (!receita) {
      console.warn(`  (sem receita) ${arquivo} — ignorado`);
      continue;
    }
    pendentes.push([arquivo, receita]);
  }

  const feitos = [];
  for (const [arquivo, receita] of pendentes) {
    feitos.push(await processar(arquivo, receita));
  }

  const total = feitos.reduce((soma, f) => soma + f.peso, 0);
  console.log(`\nPronto — ${feitos.length} pecas, ${bytes(total)} em src/assets/collage\n`);

  // O MANIFESTO.
  //
  // A dimensao de cada peca precisa existir em tempo de execucao, e antes de
  // a imagem carregar: a figurinha que cola reserva a altura da caixa pela
  // proporcao da arte, e descobrir isso no `onload` significaria um salto de
  // layout no meio da animacao. Como quem redimensiona e este script, e ele
  // que sabe — entao e ele que anota.
  feitos.sort((a, b) => a.nome.localeCompare(b.nome));
  const manifesto = Object.fromEntries(feitos.map((f) => [f.nome, { w: f.w, h: f.h }]));
  await writeFile(
    join(OUT_DIR, 'manifesto.json'),
    `${JSON.stringify(manifesto, null, 2)}\n`,
    'utf8',
  );

  // A proporcao tambem interessa a direcao de arte: uma peca 3:1 e uma 1:1
  // com a mesma `w` ocupam areas completamente diferentes na composicao.
  console.log('Proporcoes (altura / largura):');
  for (const f of feitos) {
    console.log(`  ${f.nome.padEnd(20)} ${(f.h / f.w).toFixed(2)}`);
  }
  console.log('');
}

main().catch((error) => {
  console.error('\nFalha ao processar assets:', error.message, '\n');
  process.exitCode = 1;
});
