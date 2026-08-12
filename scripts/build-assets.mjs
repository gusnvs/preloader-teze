/**
 * Pipeline de assets — `npm run assets`
 *
 * Converte as ilustracoes brutas (src/assets/raw) nas pecas que o
 * pre-loader consome (src/assets/collage):
 *
 *   1. apara a margem inutil       -> a peca passa a ocupar 100% do quadro,
 *                                     entao `--tz-w` na composicao significa
 *                                     de fato a largura visivel da peca;
 *   2. redimensiona para o teto real de exibicao (2x do maior uso);
 *   3. exporta WebP com qualidade alta e PNG apenas onde ha alpha.
 *
 * Rodar de novo e seguro e idempotente. As fontes ficam versionadas em
 * `raw/` para que a direcao de arte possa reprocessar quando quiser.
 */

import { readdir, mkdir, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const HERE = dirname(fileURLToPath(import.meta.url));
const RAW_DIR = join(HERE, '..', 'src', 'assets', 'raw');
const OUT_DIR = join(HERE, '..', 'src', 'assets', 'collage');

/**
 * @typedef {Object} AssetRecipe
 * @property {number} width    largura maxima de saida em px
 * @property {boolean} [alpha] preserva transparencia (exporta tambem .png)
 * @property {boolean} [trim]  apara a moldura branca/transparente
 * @property {number} [threshold] tolerancia do aparo (0-100)
 */

/** @type {Record<string, AssetRecipe>} */
const RECIPES = {
  // O mascote e a unica peca com recorte real: precisa manter a borda
  // creme de adesivo die-cut, que o modo `multiply` apagaria.
  'mascote-recortado': { width: 900, alpha: true, trim: true, threshold: 8 },

  // Carimbos e desenhos a tinta ficam em fundo branco de proposito:
  // sao aplicados com `mix-blend-mode: multiply` e se fundem ao papel,
  // exatamente como tinta impressa. Zero custo de recorte.
  pegada: { width: 260, trim: true, threshold: 14 },
  garrafa: { width: 520, trim: true, threshold: 10 },
  taca: { width: 460, trim: true, threshold: 10 },
  buque: { width: 620, trim: true, threshold: 10 },
  eiffel: { width: 520, trim: true, threshold: 10 },
  chapeu: { width: 620, trim: true, threshold: 10 },
  scarpins: { width: 560, trim: true, threshold: 10 },

  // Textura de fundo: repete em mosaico, nao pode ser aparada.
  'textura-papel': { width: 1200, trim: false },
};

const bytes = (n) => `${(n / 1024).toFixed(0)} kB`;

async function processOne(name, recipe) {
  const source = join(RAW_DIR, `${name}.png`);
  const before = (await stat(source)).size;

  let pipeline = sharp(source);

  if (recipe.trim) {
    // `trim` remove a moldura uniforme das bordas. Em pecas com alpha ele
    // usa a transparencia; nas de fundo branco, a propria cor de fundo.
    pipeline = pipeline.trim({
      background: recipe.alpha ? { r: 0, g: 0, b: 0, alpha: 0 } : '#ffffff',
      threshold: recipe.threshold ?? 10,
    });
  }

  pipeline = pipeline.resize({
    width: recipe.width,
    withoutEnlargement: true,
    fit: 'inside',
  });

  const outputs = [];

  if (recipe.alpha) {
    const png = await pipeline
      .clone()
      .png({ compressionLevel: 9, palette: true, quality: 92 })
      .toBuffer();
    await sharp(png).toFile(join(OUT_DIR, `${name}.png`));
    outputs.push([`${name}.png`, png.length]);
  }

  const webp = await pipeline
    .clone()
    .webp({ quality: recipe.alpha ? 92 : 88, effort: 6, alphaQuality: 100 })
    .toBuffer();
  await sharp(webp).toFile(join(OUT_DIR, `${name}.webp`));
  outputs.push([`${name}.webp`, webp.length]);

  const meta = await sharp(webp).metadata();
  const saved = outputs.map(([file, size]) => `${file} ${bytes(size)}`).join('  ·  ');
  console.log(
    `  ${name.padEnd(20)} ${String(meta.width).padStart(4)}x${String(meta.height).padEnd(4)}  ` +
      `${bytes(before)} -> ${saved}`,
  );
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const present = new Set(
    (await readdir(RAW_DIR)).filter((f) => f.endsWith('.png')).map((f) => f.replace(/\.png$/, '')),
  );

  console.log('\nProcessando assets da colagem Tezê\n');

  const pending = Object.entries(RECIPES).filter(([name]) => {
    if (present.has(name)) return true;
    console.warn(`  (ausente) ${name}.png — a peca sera ignorada em tempo de execucao`);
    return false;
  });

  for (const [name, recipe] of pending) {
    await processOne(name, recipe);
  }

  console.log(`\nPronto — ${pending.length} pecas em src/assets/collage\n`);
}

main().catch((error) => {
  console.error('\nFalha ao processar assets:', error.message, '\n');
  process.exitCode = 1;
});
