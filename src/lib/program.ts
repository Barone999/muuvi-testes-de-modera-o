export type IntervalKind = "warmup" | "run" | "walk" | "cooldown";
export interface Interval {
  kind: IntervalKind;
  seconds: number;
}

export interface WeekPlan {
  week: number;
  run: number; // minutes
  walk: number;
  reps: number;
  title: string;
}

export const PROGRAM: WeekPlan[] = [
  { week: 1, run: 1, walk: 2, reps: 8, title: "Primeiros passos" },
  { week: 2, run: 1.5, walk: 2, reps: 7, title: "Ganhando ritmo" },
  { week: 3, run: 2, walk: 2, reps: 6, title: "Equilíbrio" },
  { week: 4, run: 3, walk: 2, reps: 5, title: "Confiança" },
  { week: 5, run: 4, walk: 2, reps: 4, title: "Resistência" },
  { week: 6, run: 5, walk: 2, reps: 4, title: "Fôlego novo" },
  { week: 7, run: 8, walk: 2, reps: 3, title: "Quase lá" },
  { week: 8, run: 10, walk: 2, reps: 3, title: "Você corre!" },
];

export const LIGHT_WALK_WEEK = 0;

export function buildIntervals(week: number): Interval[] {
  if (week === LIGHT_WALK_WEEK) return [{ kind: "walk", seconds: 20 * 60 }];
  const p = PROGRAM.find((w) => w.week === week) ?? PROGRAM[0];
  const out: Interval[] = [{ kind: "warmup", seconds: 5 * 60 }];
  for (let i = 0; i < p.reps; i++) {
    out.push({ kind: "run", seconds: p.run * 60 });
    out.push({ kind: "walk", seconds: p.walk * 60 });
  }
  out.push({ kind: "cooldown", seconds: 5 * 60 });
  return out;
}

export function totalMinutes(week: number) {
  return Math.round(buildIntervals(week).reduce((a, i) => a + i.seconds, 0) / 60);
}

export function describeWeek(week: number) {
  if (week === LIGHT_WALK_WEEK) return "20 min de caminhada leve";
  const p = PROGRAM.find((w) => w.week === week)!;
  const run = p.run % 1 ? `${p.run.toString().replace(".", ",")} min` : `${p.run} min`;
  return `${run} correndo + ${p.walk} min caminhando, ${p.reps}x`;
}

export interface Done {
  week: number;
  session: number;
}

/** Next session in the program, plus per-week completion. */
export function programProgress(done: Done[], perWeek: number) {
  const count = (w: number) =>
    new Set(done.filter((d) => d.week === w).map((d) => d.session)).size;
  const weeks = PROGRAM.map((p, i) => {
    const completed = count(p.week);
    const unlocked = i === 0 || count(PROGRAM[i - 1].week) >= perWeek;
    return { ...p, completed: Math.min(completed, perWeek), unlocked, finished: completed >= perWeek };
  });
  const current = weeks.find((w) => w.unlocked && !w.finished) ?? weeks[weeks.length - 1];
  const doneSessions = new Set(done.filter((d) => d.week === current.week).map((d) => d.session));
  let nextSession = 1;
  while (doneSessions.has(nextSession) && nextSession < perWeek) nextSession++;
  return { weeks, current, nextSession };
}
