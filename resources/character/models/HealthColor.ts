// ÚNICA implementação da fórmula de cor do anel de vida (Tela de Exibição). Ver
// `.claude/rules/table-concept.md` seção 2 — nenhum componente deve reimplementar
// este cálculo, sempre importar `healthColor()` daqui.
//
// Interpolação linear componente-a-componente em RGB (não HSL): HSL passaria por
// tons esverdeados/acinzentados indesejados no meio do caminho entre vermelho e
// amarelo.
import Color from 'color';
import { GREEN, RED, YELLOW } from '@/shared/constants/colors';

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function lerpChannel(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

function lerpColor(from: string, to: string, t: number): [number, number, number] {
  const [r1, g1, b1] = Color(from).rgb().array();
  const [r2, g2, b2] = Color(to).rgb().array();

  return [lerpChannel(r1, r2, t), lerpChannel(g1, g2, t), lerpChannel(b1, b2, t)];
}

// `hp_max <= 0` é tratado como 0% (vermelho puro) em vez de lançar/gerar NaN.
function healthPercent(hpCurrent: number, hpMax: number): number {
  if (hpMax <= 0) return 0;

  return clamp((hpCurrent / hpMax) * 100, 0, 100);
}

export function healthColor(hpCurrent: number, hpMax: number): string {
  const percent = healthPercent(hpCurrent, hpMax);

  const [r, g, b] = percent <= 50
    ? lerpColor(RED, YELLOW, percent / 50)
    : lerpColor(YELLOW, GREEN, (percent - 50) / 50);

  return Color.rgb(r, g, b).hex().toLowerCase();
}
