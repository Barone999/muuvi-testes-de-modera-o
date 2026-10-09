import { fmtDate, toDateOnly } from "./cycle";

export type Trimester = 1 | 2 | 3;
const DAY = 86_400_000;

/** Due date from current gestational week (40-week pregnancy). */
export function dueDateFromWeeks(weeks: number, today = new Date()): string {
  const d = toDateOnly(today);
  d.setDate(d.getDate() + (40 - weeks) * 7);
  return fmtDate(d);
}

/** Gestational week (1–42) and day within week from the due date. */
export function gestation(due: string, today = new Date()) {
  const [y, m, dd] = due.split("-").map(Number);
  const dueD = new Date(y!, m! - 1, dd!);
  const daysPregnant = 280 - Math.round((dueD.getTime() - toDateOnly(today).getTime()) / DAY);
  const clamped = Math.max(0, Math.min(daysPregnant, 42 * 7));
  const week = Math.max(1, Math.floor(clamped / 7) + 1);
  const trimester: Trimester = week <= 13 ? 1 : week <= 27 ? 2 : 3;
  const daysLeft = Math.max(0, 280 - clamped);
  return { week, dayOfWeek: (clamped % 7) + 1, trimester, daysLeft };
}

export const TRIMESTERS: Record<Trimester, { name: string; range: string; body: string; workout: string; bg: string }> = {
  1: {
    name: "1º trimestre",
    range: "semanas 1 a 13",
    body: "Seu corpo está trabalhando muito por dentro. Cansaço, enjoo e sono são comuns — descansar também é cuidar.",
    workout: "Caminhadas curtas e tranquilas, nos dias em que você se sentir bem. Se não der, tudo bem.",
    bg: "bg-blush",
  },
  2: {
    name: "2º trimestre",
    range: "semanas 14 a 27",
    body: "Muitas gestantes sentem mais disposição agora. A barriga cresce e o equilíbrio vai mudando aos poucos.",
    workout: "Caminhadas em ritmo confortável, em terreno plano, com pausas para beber água.",
    bg: "bg-sage",
  },
  3: {
    name: "3º trimestre",
    range: "semanas 28 até o parto",
    body: "O corpo está se preparando para o encontro. Peso, inchaço e falta de ar podem aparecer — vá com calma.",
    workout: "Caminhadas leves e curtas, com bastante pausa. Ouça seu corpo e pare ao menor desconforto.",
    bg: "bg-surface",
  },
};

export const PREGNANCY_TIPS = [
  "Beba água ao longo do dia, um pouquinho de cada vez.",
  "Use um tênis confortável e roupas que não apertem a barriga.",
  "Se sentir tontura, falta de ar ou dor, pare e descanse.",
  "Prefira caminhar nos horários mais frescos do dia.",
  "Alongamentos suaves ajudam a aliviar a lombar.",
  "Descansar com as pernas para cima ajuda com o inchaço.",
  "Celebre cada passo: movimento gentil já é muito.",
];

export function dailyTip(today = new Date()) {
  return PREGNANCY_TIPS[today.getDate() % PREGNANCY_TIPS.length]!;
}
