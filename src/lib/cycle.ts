export type Phase = "menstrual" | "folicular" | "ovulatoria" | "lutea";

export interface CycleSettings {
  last_period_start: string | null;
  cycle_length: number;
  period_length: number;
}

const DAY = 86400000;

export function toDateOnly(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function parseDate(s: string) {
  const [y, m, d] = s.split("-").map(Number) as [number, number, number];
  return new Date(y, m - 1, d);
}

export function fmtDate(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Day of cycle (1-based) for a given date. Works for past and future dates. */
export function cycleDay(date: Date, s: CycleSettings): number | null {
  if (!s.last_period_start) return null;
  const start = parseDate(s.last_period_start);
  const diff = Math.round((toDateOnly(date).getTime() - start.getTime()) / DAY);
  const len = s.cycle_length;
  return (((diff % len) + len) % len) + 1;
}

export function phaseForDay(day: number, s: CycleSettings): Phase {
  const ovulation = s.cycle_length - 14;
  if (day <= s.period_length) return "menstrual";
  if (day >= ovulation - 1 && day <= ovulation + 1) return "ovulatoria";
  if (day < ovulation - 1) return "folicular";
  return "lutea";
}

export function phaseForDate(date: Date, s: CycleSettings): Phase | null {
  const d = cycleDay(date, s);
  return d == null ? null : phaseForDay(d, s);
}

/**
 * Reference date after a period start is unmarked: unchanged unless it pointed at the
 * removed date; then the latest remaining recorded start, or null when none is left.
 */
export function referenceAfterRemoval(current: string | null, removed: string, remainingStarts: string[]) {
  if (current !== removed) return current;
  const rest = remainingStarts.filter((d) => d !== removed).sort();
  return rest.length ? rest[rest.length - 1]! : null;
}

export const FLOW_LEVELS = ["Muito leve", "Leve", "Moderado", "Intenso"] as const;
export type Flow = (typeof FLOW_LEVELS)[number];

/** Toggle a flow choice: tapping the selected level again removes it. */
export function toggleFlow(current: string | null, picked: Flow): Flow | null {
  return current === picked ? null : picked;
}

/** Latest real recorded period start on or before `date` (YYYY-MM-DD), or null. */
export function periodStartFor(date: string, starts: string[]): string | null {
  const prior = starts.filter((d) => d <= date).sort();
  return prior.length ? prior[prior.length - 1]! : null;
}

/** Other end dates of the same period (between its start and the next start) to unmark. */
export function endsToClear(start: string, endDate: string, starts: string[], ends: string[]): string[] {
  const next = starts.filter((d) => d > start).sort()[0];
  return ends.filter((d) => d !== endDate && d >= start && (!next || d < next));
}

/** Observed period length in days, counting start and end days. */
export function observedLength(start: string, end: string): number {
  return Math.round((parseDate(end).getTime() - parseDate(start).getTime()) / DAY) + 1;
}

export interface PhaseInfo {
  name: string;
  short: string;
  feeling: string;
  intensity: "leve" | "moderada" | "progredir" | "pico";
  recommendation: string;
  workoutHint: "light" | "program";
}

export const PHASES: Record<Phase, PhaseInfo> = {
  menstrual: {
    name: "Fase menstrual",
    short: "Menstrual",
    feeling:
      "A energia pode estar mais baixa e o corpo pede descanso. Cólicas e cansaço são comuns.",
    intensity: "leve",
    recommendation:
      "Que tal uma caminhada leve ou um treino curto? Hoje é opcional — descansar também conta.",
    workoutHint: "light",
  },
  folicular: {
    name: "Fase folicular",
    short: "Folicular",
    feeling: "A energia costuma voltar aos poucos. Muitas mulheres se sentem mais dispostas.",
    intensity: "progredir",
    recommendation: "Bom momento para seguir o programa e, se sentir vontade, progredir.",
    workoutHint: "program",
  },
  ovulatoria: {
    name: "Fase ovulatória",
    short: "Ovulatória",
    feeling: "Costuma ser o pico de energia e confiança do ciclo.",
    intensity: "pico",
    recommendation: "Energia em alta! Aproveite o treino do programa no seu ritmo.",
    workoutHint: "program",
  },
  lutea: {
    name: "Fase lútea",
    short: "Lútea",
    feeling:
      "A energia pode ir diminuindo, com mais sensibilidade, inchaço ou vontade de doces.",
    intensity: "moderada",
    recommendation:
      "Reduza a intensidade aos poucos e priorize o conforto. Caminhar mais nos intervalos é ótimo.",
    workoutHint: "program",
  },
};

export const PHASE_BG: Record<Phase, string> = {
  menstrual: "bg-phase-menstrual",
  folicular: "bg-phase-folicular",
  ovulatoria: "bg-phase-ovulatoria",
  lutea: "bg-phase-lutea",
};

export const MOTIVATION = [
  "Cada passo conta. Vá no seu ritmo.",
  "Seu corpo é sua casa — trate com carinho.",
  "Constância é mais importante que velocidade.",
  "Hoje, o suficiente já é muito.",
  "Você não precisa ser rápida, só precisa começar.",
  "Respeitar o corpo também é treinar.",
];
