/**
 * Preferencia de movimento do sistema operacional.
 *
 * Nao tratamos `prefers-reduced-motion` como "desligar a animacao". A
 * historia continua sendo contada — a colagem se monta e se desfaz — mas
 * sem deslocamento, sem rotacao e sem inercia: apenas opacidade e tempo.
 */

const QUERY = '(prefers-reduced-motion: reduce)';

/** @returns {boolean} */
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia(QUERY).matches;

/**
 * Observa mudancas da preferencia em tempo real (o usuario pode alternar
 * o ajuste com a aba aberta).
 * @param {(reduced: boolean) => void} callback
 * @returns {() => void} funcao de limpeza
 */
export function watchMotionPreference(callback) {
  if (typeof window === 'undefined') return () => {};
  const mql = window.matchMedia(QUERY);
  const handler = (event) => callback(event.matches);
  mql.addEventListener('change', handler);
  return () => mql.removeEventListener('change', handler);
}
