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

// Vida extra (`extra_hp`, ver `.claude/rules/table-concept.md` seção 2) entra
// igualmente no numerador e no denominador: máximo = hp_max + extra_hp, atual
// = hp_current + extra_hp. `(hp_max + extra_hp) <= 0` é tratado como 0%
// (vermelho puro) em vez de lançar/gerar NaN.
export function healthPercent(hpCurrent: number, hpMax: number, extraHp = 0): number {
  const effectiveMax = hpMax + extraHp;

  if (effectiveMax <= 0) return 0;

  return clamp(((hpCurrent + extraHp) / effectiveMax) * 100, 0, 100);
}

export function healthColor(hpCurrent: number, hpMax: number, extraHp = 0): string {
  const percent = healthPercent(hpCurrent, hpMax, extraHp);

  const [r, g, b] = percent <= 50
    ? lerpColor(RED, YELLOW, percent / 50)
    : lerpColor(YELLOW, GREEN, (percent - 50) / 50);

  return Color.rgb(r, g, b).hex().toLowerCase();
}
