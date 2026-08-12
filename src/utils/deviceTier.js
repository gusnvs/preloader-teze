/**
 * Orçamento de densidade por aparelho.
 *
 * A colagem lotada é o ponto da animação, mas ela tem um custo real: cada
 * peça em movimento é um recálculo de estilo por quadro. Medindo com a CPU
 * estrangulada em 4×, a densidade máxima passa de ~9% de quadros perdidos —
 * enquanto na mesma máquina sem estrangulamento fica em 0,7%.
 *
 * O erro seria escolher um dos dois: baixar a densidade para todo mundo
 * (e perder o efeito no aparelho que aguenta) ou manter (e engasgar no que
 * não aguenta). Então o número de adesivos passa a ser uma função do
 * aparelho, decidida uma vez no carregamento.
 *
 * Os sinais são grosseiros de propósito. `hardwareConcurrency` e
 * `deviceMemory` não medem GPU nem a carga do momento — mas separam bem um
 * desktop de um celular intermediário, que é a decisão que precisamos tomar.
 * Errar para o lado conservador custa alguns adesivos; errar para o outro
 * custa a animação inteira.
 */

/** @typedef {'alta' | 'media' | 'baixa'} Tier */

/** @returns {Tier} */
export function detectTier() {
  if (typeof navigator === 'undefined') return 'media';

  // Respeitar economia de dados/bateria é mais importante que o efeito.
  if (navigator.connection?.saveData) return 'baixa';

  const nucleos = navigator.hardwareConcurrency ?? 4;
  const memoria = navigator.deviceMemory ?? 4;
  const toque = navigator.maxTouchPoints > 0;

  if (nucleos <= 4 || memoria <= 4) return 'baixa';
  if (nucleos <= 8 || memoria <= 8 || toque) return 'media';
  return 'alta';
}

/**
 * Permite forçar um nível pela URL, para conferir os três sem trocar de
 * aparelho: `?densidade=baixa`.
 * @returns {Tier}
 */
export function resolveTier() {
  if (typeof window === 'undefined') return 'media';
  const pedido = new URLSearchParams(window.location.search).get('densidade');
  if (pedido === 'alta' || pedido === 'media' || pedido === 'baixa') return pedido;
  return detectTier();
}
