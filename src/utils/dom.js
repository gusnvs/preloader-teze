/** Auxiliares de DOM. Nada de framework: o pre-loader deve ser portavel. */

/**
 * Cria um elemento ja configurado.
 * @param {string} tag
 * @param {{ class?: string, html?: string, text?: string, style?: Record<string,string>, [attr: string]: any }} options
 * @param {Node[]} children
 */
export function el(tag, options = {}, children = []) {
  const node = document.createElement(tag);
  const { class: className, html, text, style, ...attrs } = options;

  if (className) node.className = className;
  if (html != null) node.innerHTML = html;
  if (text != null) node.textContent = text;
  if (style) Object.entries(style).forEach(([k, v]) => node.style.setProperty(k, v));

  Object.entries(attrs).forEach(([key, value]) => {
    if (value == null || value === false) return;
    node.setAttribute(key, value === true ? '' : String(value));
  });

  children.forEach((child) => child && node.appendChild(child));
  return node;
}

/** Define varias custom properties de uma vez. */
export function setVars(node, vars) {
  Object.entries(vars).forEach(([key, value]) => {
    if (value == null) return;
    node.style.setProperty(key, String(value));
  });
  return node;
}

export const qs = (selector, scope = document) => scope.querySelector(selector);
export const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

/** Um frame de respiro — util para deixar o navegador aplicar estilos iniciais. */
export const nextFrame = () =>
  new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

/**
 * Decodifica imagens fora da thread principal.
 * Evita que o primeiro frame da timeline pague o custo de decode e
 * derrube os 60 FPS logo na abertura.
 */
export async function decodeImages(root) {
  const images = Array.from(root.querySelectorAll('img'));
  await Promise.allSettled(
    images.map((img) => (typeof img.decode === 'function' ? img.decode() : Promise.resolve())),
  );
}
