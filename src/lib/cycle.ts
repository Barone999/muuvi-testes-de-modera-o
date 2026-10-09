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
  const [y, m, d] = s.split("-").map(Number);
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
