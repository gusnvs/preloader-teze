/**
 * Registro de assets.
 *
 * Toda a colagem e feita da arte oficial da Tezê: PNG recortado, processado
 * por `npm run assets` em WebP com alpha. Nao ha mais duas naturezas de peca
 * (vetor x pintura) nem pecas de fundo branco esperando `mix-blend-mode` —
 * tudo e recorte, e o que se ve e o que existe no arquivo.
 *
 * Junto com as imagens vem o MANIFESTO, escrito pelo mesmo script: a
 * dimensao de cada peca em pixels. Ela precisa existir ANTES de a imagem
 * carregar, porque a figurinha que cola reserva a altura da caixa pela
 * proporcao da arte — descobrir isso no `onload` seria um salto de layout no
 * meio da animacao.
 *
 * O registro tolera ausencias de proposito: uma peca sem asset e apenas
 * ignorada com aviso em desenvolvimento. Assim a composicao pode ser editada
 * antes de a arte final existir.
 */

import manifesto from '../assets/collage/manifesto.json';

const bitmapModules = import.meta.glob('../assets/collage/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});

const basename = (path) => path.split('/').pop().replace(/\.\w+$/, '');

/** @type {Map<string, { src: string, w: number, h: number, ratio: number }>} */
const registry = new Map();

for (const [path, src] of Object.entries(bitmapModules)) {
  const nome = basename(path);
  const medida = manifesto[nome] ?? { w: 1, h: 1 };
  registry.set(nome, { src, w: medida.w, h: medida.h, ratio: medida.w / medida.h });
}

/** Assets que existem de fato neste build. */
export const availableAssets = () => Array.from(registry.keys()).sort();

/** @returns {{src:string, w:number, h:number, ratio:number} | null} */
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

  const img = document.createElement('img');
  img.src = asset.src;
  img.alt = label;
  img.width = asset.w;
  img.height = asset.h;
  img.decoding = 'async';
  img.loading = 'eager';
  img.draggable = false;
  return img;
}
