/**
 * Utilitarios numericos.
 *
 * Toda aleatoriedade da colagem passa por um gerador com semente: a
 * composicao precisa ser identica em toda execucao para que a direcao de
 * arte seja ajustavel. "Organico" aqui significa irregular, nao imprevisivel.
 */

/** Limita `value` ao intervalo [min, max]. */
export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/** Interpolacao linear entre `a` e `b`. */
export const lerp = (a, b, t) => a + (b - a) * t;

/** Reprojeta `value` do intervalo de entrada para o de saida. */
export const mapRange = (value, inMin, inMax, outMin, outMax) =>
  outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);

/** Distancia euclidiana entre dois pontos {x, y}. */
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export const degToRad = (deg) => (deg * Math.PI) / 180;
export const radToDeg = (rad) => (rad * 180) / Math.PI;

/**
 * Gerador pseudoaleatorio determinístico (mulberry32).
 * @param {number} seed
 * @returns {() => number} funcao que devolve floats em [0, 1)
 */
export function createRandom(seed = 20260805) {
  let state = seed >>> 0;
  return function random() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fabrica de variacoes determinísticas a partir de uma chave textual.
 * Permite dar a cada peca um "jeito proprio" estavel sem escrever
 * numeros magicos um a um no arquivo de composicao.
 */
export function createJitter(seedKey = 'teze') {
  let hash = 2166136261;
  for (let i = 0; i < seedKey.length; i += 1) {
    hash ^= seedKey.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const random = createRandom(hash);

  return {
    /** Float em [min, max]. */
    range: (min, max) => lerp(min, max, random()),
    /** Inteiro em [min, max]. */
    int: (min, max) => Math.round(lerp(min, max, random())),
    /** Desvio simetrico em torno de zero. */
    spread: (amount) => lerp(-amount, amount, random()),
    /** Escolhe um item da lista. */
    pick: (list) => list[Math.floor(random() * list.length) % list.length],
    /** `true` com a probabilidade dada. */
    chance: (probability) => random() < probability,
    raw: random,
  };
}

/**
 * Ponto sobre uma curva de Bezier quadratica.
 * Usada para desenhar a trajetoria (levemente torta) das pegadas.
 */
export function quadraticPoint(p0, p1, p2, t) {
  const inv = 1 - t;
  return {
    x: inv * inv * p0.x + 2 * inv * t * p1.x + t * t * p2.x,
    y: inv * inv * p0.y + 2 * inv * t * p1.y + t * t * p2.y,
  };
}

/** Tangente (em graus) da mesma curva, para orientar cada pegada. */
export function quadraticTangent(p0, p1, p2, t) {
  const inv = 1 - t;
  const dx = 2 * inv * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
  const dy = 2 * inv * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
  return radToDeg(Math.atan2(dy, dx));
}
