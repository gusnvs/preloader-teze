/**
 * Registro de assets.
 *
 * Duas naturezas convivem na colagem, e a escolha nao e tecnica, e de arte:
 *
 *  · SVG  — pecas graficas (selos, fitas, bilhetes, carimbos). Entram
 *           inline no documento para herdar as fontes da marca, escalar
 *           sem perda e permitir animar partes internas no futuro.
 *
 *  · WEBP — ilustracoes pintadas (mascote, garrafa, taca, buque). Textura
 *           e imperfeicao que nenhum vetor reproduz.
 *
 * O registro tolera ausencias de proposito: uma peca sem asset e apenas
 * ignorada com aviso em desenvolvimento. Assim a composicao pode ser
 * editada antes da arte final existir.
 */

const svgModules = import.meta.glob('../assets/svg/*.svg', {
  eager: true,
  query: '?raw',
  import: 'default',
});

const bitmapModules = import.meta.glob('../assets/collage/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});

const basename = (path) => path.split('/').pop().replace(/\.\w+$/, '');

/** @type {Map<string, { kind: 'svg'|'image', markup?: string, src?: string }>} */
const registry = new Map();

for (const [path, markup] of Object.entries(svgModules)) {
  registry.set(basename(path), { kind: 'svg', markup });
}

for (const [path, src] of Object.entries(bitmapModules)) {
  registry.set(basename(path), { kind: 'image', src });
}

/** Assets que existem de fato neste build. */
export const availableAssets = () => Array.from(registry.keys()).sort();

/** @returns {{kind:'svg'|'image', markup?:string, src?:string} | null} */
export function getAsset(key) {
  return registry.get(key) ?? null;
}

export const hasAsset = (key) => registry.has(key);

/**
 * URL da textura de papel usada como fundo do palco.
 * Devolve `null` se o asset nao foi processado — o CSS entao cai no
 * gradiente de papel, sem quebrar nada.
 */
export const paperTextureUrl = () => registry.get('textura-papel')?.src ?? null;

/**
 * Monta o no visual de uma peca.
 * @param {string} key
 * @param {string} label texto alternativo (decorativo por padrao)
 */
export function createAssetNode(key, label = '') {
  const asset = getAsset(key);
  if (!asset) return null;

  if (asset.kind === 'svg') {
    const holder = document.createElement('div');
    holder.innerHTML = asset.markup;
    const svg = holder.firstElementChild;
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    // A largura vem do container; a altura segue o viewBox.
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    return svg;
  }

  const img = document.createElement('img');
  img.src = asset.src;
  img.alt = label;
  img.decoding = 'async';
  img.loading = 'eager';
  img.draggable = false;
  return img;
}
