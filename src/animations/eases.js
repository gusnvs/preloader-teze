/**
 * CURVAS DA MARCA
 *
 * Nenhum movimento aqui e linear e nenhum usa as curvas de prateleira sem
 * motivo. Cada uma descreve um comportamento fisico especifico do papel:
 *
 *   tz.settle   papel que cai e assenta — chega rapido, acomoda devagar
 *   tz.stamp    carimbo — impacto seco, micro-recuo, repouso
 *   tz.press    polegar colando um adesivo — hesita, corre, assenta longo
 *   tz.breeze   inicio de vento — hesita antes de convencer
 *   tz.gust     rajada — sai acelerando, sem volta
 *   tz.veil     luz — abre lento, fecha limpo
 *   tz.drift    deriva longa, simetrica
 *   tz.flutter  tremor amortecido do papel (CustomWiggle)
 *
 * Registrar por nome permite trocar a curva no arquivo de configuracao
 * sem tocar em nenhuma cena.
 */

import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { CustomWiggle } from 'gsap/CustomWiggle';

let registered = false;

export function registerEases() {
  if (registered) return;

  gsap.registerPlugin(CustomEase, CustomWiggle);

  // Aterrissagem: 78% do percurso no primeiro terco do tempo, depois um
  // deslizar longo ate parar. E como uma folha encontra a mesa.
  CustomEase.create('tz.settle', 'M0,0 C0.12,0.44 0.16,0.94 0.38,0.99 C0.6,1.006 0.78,1 1,1');

  // Carimbo: desce forte, ultrapassa 3%, volta. O recuo e o que faz o
  // gesto parecer ter peso.
  CustomEase.create('tz.stamp', 'M0,0 C0.05,0.6 0.1,1.03 0.26,1.028 C0.46,1.024 0.66,1 1,1');

  // Vento nascendo: quase nada acontece nos primeiros 30%.
  CustomEase.create('tz.breeze', 'M0,0 C0.36,0.008 0.42,0.2 0.56,0.5 C0.7,0.8 0.84,1 1,1');

  // Rajada: comeca lento e nunca mais desacelera.
  CustomEase.create('tz.gust', 'M0,0 C0.34,0 0.52,0.06 0.66,0.24 C0.82,0.46 0.94,0.8 1,1');

  // Polegar assentando um adesivo: hesita no primeiro contato (a cola ainda
  // esta pegando), corre pelo meio e desacelera longo no fim, quando so falta
  // a ponta. Nao e um `power2.inOut` — a saida e bem mais longa que a entrada,
  // porque a ultima lasquinha e sempre a mais demorada.
  CustomEase.create(
    'tz.press',
    'M0,0 C0.16,0 0.26,0.1 0.38,0.38 C0.5,0.66 0.62,0.92 0.74,0.98 C0.84,1.004 0.92,1 1,1',
  );

  // Luz/veu: entrada suave, saida limpa, sem overshoot.
  CustomEase.create('tz.veil', 'M0,0 C0.26,0.02 0.2,1 1,1');

  // Deriva simetrica, para respiros longos.
  CustomEase.create('tz.drift', 'M0,0 C0.42,0 0.2,1 1,1');

  // Tremor do papel: tres oscilacoes que morrem sozinhas.
  CustomWiggle.create('tz.flutter', { wiggles: 3, type: 'easeOut' });
  CustomWiggle.create('tz.flutter.curto', { wiggles: 2, type: 'easeOut' });

  registered = true;
}
