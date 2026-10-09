import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, CheckCircle2, Play } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useProfile, useSessions } from "@/lib/data";
import { describeWeek, pregnancyWeek, programProgress, totalMinutes } from "@/lib/program";
import { gestation, TRIMESTERS } from "@/lib/pregnancy";
import { PregnancyDisclaimer } from "@/components/Pregnancy";

export const Route = createFileRoute("/_authenticated/treinos")({
  head: () => ({ meta: [{ title: "Treinos — Muuvi" }, { name: "description", content: "Seu programa de 8 semanas." }] }),
  component: Treinos,
});

function Treinos() {
  const { data: profile } = useProfile();
  const { data: sessions = [] } = useSessions();
  const perWeek = profile?.days_per_week ?? 3;
  const { weeks, current } = programProgress(sessions, perWeek);
  const doneSet = new Set(sessions.map((s) => `${s.week}-${s.session}`));

  if (profile?.pregnant && profile.due_date) {
    const tri = gestation(profile.due_date).trimester;
    return (
      <AppShell title="Treinos">
        <p className="mb-4 text-foreground/70">No Modo Gestante, o programa de corrida fica pausado. Aqui o foco é conforto, baixo impacto e pausas para água.</p>
        <div className="space-y-3">
          {([1, 2, 3] as const).map((n) => {
            const w = pregnancyWeek(n);
            return (
              <Link key={n} to="/treino/$week/$session" params={{ week: String(w), session: "1" }} className={`flex items-center justify-between gap-3 rounded-3xl p-5 ${n === tri ? "bg-blush" : "bg-surface"}`}>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-bronze">{TRIMESTERS[n].name}{n === tri && " · você está aqui"}</p>
                  <h3 className="text-lg font-bold">Caminhada no seu ritmo</h3>
                  <p className="text-sm text-foreground/70">{describeWeek(w)} · {totalMinutes(w)} min</p>
                </div>
                <Play className="h-5 w-5 shrink-0 text-ink" />
              </Link>
            );
          })}
          <Link to="/treino/$week/$session" params={{ week: "0", session: "0" }} className="flex items-center justify-between rounded-3xl bg-sage p-5">
            <div>
              <p className="font-display font-bold text-ink">Caminhada leve livre</p>
              <p className="text-sm text-foreground/70">20 min · pare quando quiser</p>
            </div>
            <Play className="h-5 w-5 text-ink" />
          </Link>
        </div>
        <PregnancyDisclaimer className="mt-4" />
      </AppShell>
    );
  }

  return (
    <AppShell title="Treinos">
      <p className="mb-4 text-foreground/70">8 semanas alternando caminhada e corrida, {perWeek} treinos por semana.</p>
      <Link to="/treino/$week/$session" params={{ week: "0", session: "0" }} className="mb-4 flex items-center justify-between rounded-3xl bg-sage p-4">
        <div>
          <p className="font-display font-bold text-ink">Caminhada leve</p>
          <p className="text-sm text-foreground/70">20 min · ideal para dias de pouca energia</p>
        </div>
        <Play className="h-5 w-5 text-ink" />
      </Link>
      <div className="space-y-3">
        {weeks.map((w) => (
          <div key={w.week} className={`rounded-3xl p-5 ${w.week === current.week ? "bg-blush" : "bg-surface"} ${!w.unlocked ? "opacity-60" : ""}`}>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-bronze">Semana {w.week}</p>
                <h3 className="text-lg font-bold">{w.title}</h3>
                <p className="text-sm text-foreground/70">{describeWeek(w.week)} · {totalMinutes(w.week)} min</p>
              </div>
              {w.finished ? (
                <CheckCircle2 className="h-6 w-6 shrink-0 text-ink" />
              ) : !w.unlocked ? (
                <Lock className="h-5 w-5 shrink-0 text-foreground/50" />
              ) : null}
            </div>
            {w.unlocked && (
              <div className="mt-3 flex flex-wrap gap-2">
                {Array.from({ length: perWeek }, (_, i) => i + 1).map((n) => {
                  const done = doneSet.has(`${w.week}-${n}`);
                  return (
                    <Link
                      key={n}
                      to="/treino/$week/$session"
                      params={{ week: String(w.week), session: String(n) }}
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${done ? "bg-sage text-ink" : "bg-ink text-ink-foreground"}`}
                    >
                      {done ? "✓ " : ""}Treino {n}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </AppShell>
  );
}
