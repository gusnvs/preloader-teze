/**
 * Roteador minimo de History API.
 *
 * Existe por um motivo de direcao: um recarregamento real de pagina mata
 * qualquer timeline em curso. Para que o pre-loader seja uma *transicao*
 * — e nao dois loadings separados — a troca de conteudo precisa acontecer
 * no meio da animacao, com a tela ja coberta pela colagem.
 *
 * Contrato com quem consome:
 *
 *   new Router({
 *     routes,          // { '/rota': () => HTMLElement }
 *     outlet,          // elemento que recebe a pagina
 *     onTransition,    // async ({ commit, from, to }) => void
 *   })
 *
 * `onTransition` recebe `commit()`. Quem orquestra decide QUANDO chamar —
 * na pratica, no instante em que a colagem cobre a tela. O roteador nao
 * sabe nada sobre GSAP nem sobre cenas.
 */

export class Router {
  #routes;
  #outlet;
  #onTransition;
  #fallback;
  #current = null;
  #navigating = false;

  constructor({ routes, outlet, onTransition, fallback = '/' }) {
    this.#routes = routes;
    this.#outlet = outlet;
    this.#onTransition = onTransition;
    this.#fallback = fallback;
  }

  /** Resolve o caminho atual e monta a primeira pagina (sem transicao). */
  start() {
    document.addEventListener('click', this.#handleClick);
    window.addEventListener('popstate', this.#handlePopState);

    const path = this.#resolve(window.location.pathname);
    this.#render(path);
    return path;
  }

  destroy() {
    document.removeEventListener('click', this.#handleClick);
    window.removeEventListener('popstate', this.#handlePopState);
  }

  get current() {
    return this.#current;
  }

  get isNavigating() {
    return this.#navigating;
  }

  /**
   * Navega para `path` rodando a transicao completa.
   * Chamadas concorrentes sao ignoradas: uma transicao nunca atropela outra.
   */
  async go(path, { replace = false, silent = false } = {}) {
    const target = this.#resolve(path);
    if (this.#navigating || target === this.#current) return;

    this.#navigating = true;
    const from = this.#current;

    const commit = () => {
      if (!silent) {
        const method = replace ? 'replaceState' : 'pushState';
        window.history[method]({ path: target }, '', target);
      }
      this.#render(target);
    };

    try {
      if (this.#onTransition) {
        await this.#onTransition({ commit, from, to: target });
      } else {
        commit();
      }
    } finally {
      this.#navigating = false;
    }
  }

  // --- interno ------------------------------------------------------------

  #resolve(path) {
    const clean = path.replace(/\/+$/, '') || '/';
    return this.#routes[clean] ? clean : this.#fallback;
  }

  #render(path) {
    const view = this.#routes[path];
    if (!view) return;

    this.#outlet.replaceChildren(view());
    this.#current = path;

    // Foco e rolagem precisam voltar ao topo como em uma navegacao real,
    // senao leitores de tela continuam no contexto da pagina anterior.
    this.#outlet.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  // Campos, e nao metodos: precisam de identidade estavel para poderem ser
  // removidos do listener em `destroy()`.
  #handleClick = (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const trigger = event.target.closest('[data-link]');
    if (!trigger) return;

    const href = trigger.dataset.link || trigger.getAttribute('href');
    if (!href || href.startsWith('http')) return;

    event.preventDefault();
    this.go(href);
  };

  #handlePopState = () => {
    // Voltar/avancar do navegador tambem merece a transicao completa.
    // `silent` evita empilhar um novo estado sobre o que o browser ja mudou.
    this.go(window.location.pathname, { silent: true });
  };
}
