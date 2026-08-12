/**
 * CENA 2 — REUNIAO
 *
 * A colagem ganha corpo. O intervalo entre as pecas encurta pela metade e
 * as entradas passam a vir das bordas: a composicao cresce de dentro para
 * fora. Cada peca mantem posicao, escala e rotacao proprias — nada aqui e
 * uma copia deslocada de outra coisa.
 */

import { gsap } from 'gsap';
import { entranceFrom } from './shared/entrance.js';

export function createSceneReuniao({ pieces, motion, stage }) {
  const cfg = motion.gather;
  const tl = gsap.timeline();

  const cast = pieces.filter((piece) => piece.data.act === 2);

  // Ordem de entrada: das pecas mais centrais para as mais perifericas.
  // A colagem parece se espalhar, em vez de piscar em bloco.
  const ordered = [...cast].sort((a, b) => {
    const distA = Math.hypot(a.data.x - 50, a.data.y - 50);
    const distB = Math.hypot(b.data.x - 50, b.data.y - 50);
    return distA - distB;
  });

  ordered.forEach((piece, index) => {
    tl.add(entranceFrom(piece, cfg, stage), index * cfg.stagger + piece.data.variation.delayJitter);
  });

  return tl;
}
