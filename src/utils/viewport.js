/**
 * Ponte entre as unidades da composicao e os pixels da tela.
 *
 * A colagem e descrita em % do palco (posicao) e em `--tz-unit` (tamanho).
 * As cenas precisam de pixels. Medir isso dentro de cada tween causaria
 * leitura de layout no meio do loop de animacao — o caminho mais curto para
 * perder quadros. Entao medimos uma vez por execucao e congelamos.
 */

/**
 * Resolve `--tz-unit` em pixels.
 *
 * O valor e declarado em vmin e muda por breakpoint, entao nao pode ser
 * deduzido da viewport: precisa ser perguntado ao proprio CSS. Uma sonda
 * invisivel de 100 unidades da a resposta com uma unica leitura de layout.
 */
function resolveUnit(node) {
  const probe = document.createElement('div');
  probe.style.cssText =
    'position:absolute;top:0;left:0;height:0;visibility:hidden;pointer-events:none;' +
    'width:calc(var(--tz-unit) * 100)';
  node.appendChild(probe);
  const unit = probe.getBoundingClientRect().width / 100;
  probe.remove();
  return unit;
}

export function measureStage(node) {
  const rect = node.getBoundingClientRect();
  const unitPx = resolveUnit(node) || Math.min(rect.width, rect.height) / 100;

  return {
    width: rect.width,
    height: rect.height,
    unitPx,
    /** Converte unidades de composicao em pixels. */
    u: (value) => value * unitPx,
    /** Converte % horizontal do palco em pixels. */
    px: (value) => (value / 100) * rect.width,
    /** Converte % vertical do palco em pixels. */
    py: (value) => (value / 100) * rect.height,
    /** Diagonal — util para garantir que uma peca saia mesmo da tela. */
    diagonal: Math.hypot(rect.width, rect.height),
  };
}

/** Telas verticais recebem outra composicao, nao a mesma encolhida. */
export const isPortrait = () =>
  typeof window !== 'undefined' && window.matchMedia('(max-aspect-ratio: 1/1)').matches;
