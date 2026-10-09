import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Flame, Timer, Trophy } from "lucide-react";
import { toast } from "sonner";
import { AppShell, Disclaimer } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate } from "@/lib/cycle";
import { uid, useCycle, useInvalidate, useProfile, useSessions } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({ meta: [{ title: "Perfil — Muuvi" }, { name: "description", content: "Seu progresso e ajustes." }] }),
  component: Perfil,
});

function streak(dates: string[]) {
  const set = new Set(dates);
  const d = new Date();
  if (!set.has(fmtDate(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (set.has(fmtDate(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

function Perfil() {
  const { data: profile } = useProfile();
  const { data: sessions = [] } = useSessions();
  const { data: cycle } = useCycle();
  const invalidate = useInvalidate();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [days, setDays] = useState(3);
  const [cycleLen, setCycleLen] = useState(28);
  const [periodLen, setPeriodLen] = useState(5);

  useEffect(() => { if (profile) { setName(profile.display_name); setDays(profile.days_per_week); } }, [profile]);
  useEffect(() => { if (cycle) { setCycleLen(cycle.settings.cycle_length); setPeriodLen(cycle.settings.period_length); } }, [cycle]);

  const minutes = sessions.reduce((a, s) => a + s.minutes, 0);
  const st = streak(sessions.map((s) => fmtDate(new Date(s.completed_at))));

  async function save() {
    const id = await uid();
    await supabase.from("profiles").update({ display_name: name, days_per_week: days }).eq("id", id);
    if (cycle && !cycle.isDemo) {
      await supabase.from("cycle_settings").update({ cycle_length: cycleLen, period_length: periodLen }).eq("user_id", id);
    }
    invalidate("profile", "cycle");
    toast.success("Ajustes salvos");
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const input = "mt-1 w-full rounded-2xl bg-background px-4 py-3";

  return (
    <AppShell title="Perfil">
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Flame, v: st, l: "dias seguidos", bg: "bg-blush" },
          { icon: Timer, v: minutes, l: "minutos", bg: "bg-sage" },
          { icon: Trophy, v: sessions.length, l: "treinos", bg: "bg-surface" },
        ].map(({ icon: I, v, l, bg }) => (
          <div key={l} className={`rounded-3xl p-4 text-center ${bg}`}>
            <I className="mx-auto h-5 w-5 text-bronze" />
            <p className="mt-1 font-display text-3xl font-bold text-ink">{v}</p>
            <p className="text-xs text-foreground/70">{l}</p>
          </div>
        ))}
      </div>

      <section className="mt-6 space-y-3 rounded-3xl bg-surface p-5">
        <h2 className="text-lg font-bold">Ajustes da conta</h2>
        <label className="block text-sm font-semibold">Nome<input className={input} value={name} onChange={(e) => setName(e.target.value)} /></label>
        <div>
          <p className="text-sm font-semibold">Treinos por semana</p>
          <div className="mt-1 grid grid-cols-7 gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <button key={n} onClick={() => setDays(n)} className={`rounded-xl py-2.5 text-sm font-bold ${days === n ? "bg-primary text-primary-foreground" : "bg-background"}`}>{n}</button>
            ))}
          </div>
        </div>
        {cycle && !cycle.isDemo && (
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-semibold">Duração do ciclo<input type="number" className={input} value={cycleLen} onChange={(e) => setCycleLen(+e.target.value)} /></label>
            <label className="block text-sm font-semibold">Dias de menstruação<input type="number" className={input} value={periodLen} onChange={(e) => setPeriodLen(+e.target.value)} /></label>
          </div>
        )}
        <button onClick={save} className="w-full rounded-full bg-primary py-3.5 font-bold text-primary-foreground">Salvar</button>
      </section>

      <Disclaimer className="mt-4" />
      <button onClick={signOut} className="mt-4 w-full rounded-full bg-ink py-3.5 font-bold text-ink-foreground">Sair</button>
    </AppShell>
  );
}
