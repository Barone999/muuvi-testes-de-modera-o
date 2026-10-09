import { createFileRoute, Link } from "@tanstack/react-router";
import { Play, Clock, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { cycleDay, MOTIVATION, PHASES, PHASE_BG, phaseForDay } from "@/lib/cycle";
import { useCycle, useProfile, useSessions } from "@/lib/data";
import { describeWeek, LIGHT_WALK_WEEK, programProgress, totalMinutes } from "@/lib/program";
import { RECIPES } from "@/lib/recipes";
import { PregnancyDisclaimer, PregnancyStatus, PregnancyTip, PregnancyWorkout } from "@/components/Pregnancy";

export const Route = createFileRoute("/_authenticated/inicio")({
  head: () => ({ meta: [{ title: "Início — Muuvi" }, { name: "description", content: "Seu treino de hoje." }] }),
  component: Inicio,
});

function Inicio() {
  const { data: profile } = useProfile();
  const { data: cycle } = useCycle();
  const { data: sessions = [] } = useSessions();
  if (!cycle || !profile) return <AppShell><div className="h-40 animate-pulse rounded-3xl bg-surface" /></AppShell>;

  if (profile.pregnant && profile.due_date) {
    const recipe = RECIPES.find((r) => r.pregnancy) ?? RECIPES[0]!;
    return (
      <AppShell title={`Oi, ${profile.display_name} 👋`}>
        <PregnancyStatus due={profile.due_date} />
        <PregnancyTip />
        <PregnancyWorkout due={profile.due_date} />
        <Link to="/receitas" className="mt-4 grid grid-cols-[96px_minmax(0,1fr)] items-center gap-4 rounded-3xl bg-surface p-3">
          <img src={recipe.image} alt={recipe.title} className="h-24 w-24 rounded-2xl object-cover" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-bronze">Receita para a gestação</p>
            <p className="mt-1 font-display font-bold text-ink">{recipe.title}</p>
            <p className="text-xs text-foreground/60">{recipe.minutes} min</p>
          </div>
        </Link>
        <PregnancyDisclaimer className="mt-4" />
      </AppShell>
    );
  }

  const day = cycleDay(new Date(), cycle.settings)!;
  const phase = phaseForDay(day, cycle.settings);
  const info = PHASES[phase];
  const perWeek = profile?.days_per_week ?? 3;
  const { current, nextSession } = programProgress(sessions, perWeek);
  const light = info.workoutHint === "light";
  const recipe = RECIPES.find((r) => r.phases.includes(phase)) ?? RECIPES[0]!;
  const quote = MOTIVATION[new Date().getDate() % MOTIVATION.length];

  return (
    <AppShell title={`Oi, ${profile?.display_name ?? ""} 👋`}>
      <section className={`rounded-3xl p-6 ${PHASE_BG[phase]}`}>
        <p className="text-sm font-semibold text-ink/70">Dia {day} do ciclo{cycle.isDemo && " · exemplo"}</p>
        <h2 className="mt-1 text-3xl font-bold">{info.name}</h2>
        <p className="mt-2 text-sm text-ink/80">{info.feeling}</p>
        {cycle.isDemo && (
          <Link to="/ciclo" className="mt-3 inline-block text-xs font-bold text-ink underline">
            Adicionar meus dados do ciclo
          </Link>
        )}
      </section>

      <section className="mt-4 rounded-3xl bg-ink p-6 text-ink-foreground">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Sugestão para hoje
        </p>
        <h3 className="mt-2 text-2xl font-bold text-ink-foreground">
          {light ? "Caminhada leve" : `Semana ${current.week} · Treino ${nextSession}`}
        </h3>
        <p className="mt-1 text-sm text-ink-foreground/75">
          {light ? describeWeek(LIGHT_WALK_WEEK) : describeWeek(current.week)}
        </p>
        <p className="mt-1 flex items-center gap-1 text-sm text-ink-foreground/60">
          <Clock className="h-3.5 w-3.5" /> {totalMinutes(light ? 0 : current.week)} min
        </p>
        <p className="mt-3 text-sm text-ink-foreground/85">{info.recommendation}</p>
        <Link
          to="/treino/$week/$session"
          params={{ week: String(light ? 0 : current.week), session: String(light ? 0 : nextSession) }}
          className="mt-5 flex items-center justify-center gap-2 rounded-full bg-primary py-4 font-bold text-primary-foreground"
        >
          <Play className="h-5 w-5 fill-current" /> Começar
        </Link>
        <div className="mt-3 flex justify-center gap-4 text-sm font-semibold">
          {light && (
            <Link to="/treino/$week/$session" params={{ week: String(current.week), session: String(nextSession) }} className="text-ink-foreground/70 underline">
              Fazer o treino do programa
            </Link>
          )}
          <Link to="/treinos" className="text-ink-foreground/70 underline">Escolher outro treino</Link>
        </div>
      </section>

      <Link to="/receitas" className="mt-4 grid grid-cols-[96px_minmax(0,1fr)] items-center gap-4 rounded-3xl bg-surface p-3">
        <img src={recipe.image} alt={recipe.title} className="h-24 w-24 rounded-2xl object-cover" />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-bronze">Receita sugerida · {recipe.moment === "pre" ? "pré-treino" : "pós-treino"}</p>
          <p className="mt-1 font-display font-bold text-ink">{recipe.title}</p>
          <p className="text-xs text-foreground/60">{recipe.minutes} min</p>
        </div>
      </Link>

      <p className="mt-6 rounded-3xl bg-sage p-5 text-center font-display text-lg font-semibold text-ink">“{quote}”</p>
    </AppShell>
  );
}
