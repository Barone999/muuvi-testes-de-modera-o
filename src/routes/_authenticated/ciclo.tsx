import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { cycleDay, fmtDate, PHASES, PHASE_BG, phaseForDay, toDateOnly, type Phase } from "@/lib/cycle";
import { uid, useCycle, useCycleLogs, useInvalidate, useSessions } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/ciclo")({
  head: () => ({ meta: [{ title: "Ciclo — Muuvi" }, { name: "description", content: "Seu calendário do ciclo." }] }),
  component: Ciclo,
});

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const ENERGY = ["Baixa", "Média", "Alta"];
const MOOD = ["😔", "😐", "🙂", "😄"];
const SYMPTOMS = ["Cólica", "Dor de cabeça", "Inchaço", "Cansaço", "Sensibilidade", "Nenhum"];

function Ciclo() {
  const { data: cycle } = useCycle();
  const { data: logs = [] } = useCycleLogs();
  const { data: sessions = [] } = useSessions();
  const invalidate = useInvalidate();
  const today = toDateOnly(new Date());
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(today);

  const workoutDays = useMemo(() => new Set(sessions.map((s) => fmtDate(new Date(s.completed_at)))), [sessions]);
  const logMap = useMemo(() => new Map(logs.map((l) => [l.log_date, l])), [logs]);

  if (!cycle) return <AppShell title="Ciclo"><div className="h-80 animate-pulse rounded-3xl bg-surface" /></AppShell>;
  const s = cycle.settings;

  const first = month.getDay();
  const daysIn = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [...Array(first).fill(null), ...Array.from({ length: daysIn }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];

  const selDay = cycleDay(selected, s)!;
  const selPhase = phaseForDay(selDay, s);
  const selKey = fmtDate(selected);
  const selLog = logMap.get(selKey);

  return (
    <AppShell title="Ciclo">
      {cycle.isDemo && (
        <p className="mb-3 rounded-2xl bg-blush p-3 text-sm">
          Você está vendo um exemplo. Registre o início da sua menstruação abaixo para personalizar.
        </p>
      )}
      <section className="rounded-3xl bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <button aria-label="Mês anterior" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="grid h-9 w-9 place-items-center rounded-full bg-background">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="text-lg font-bold">{MONTHS[month.getMonth()]} {month.getFullYear()}</h2>
          <button aria-label="Próximo mês" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="grid h-9 w-9 place-items-center rounded-full bg-background">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-foreground/50">
          {WEEKDAYS.map((w, i) => <span key={i}>{w}</span>)}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <span key={i} />;
            const ph = phaseForDay(cycleDay(d, s)!, s);
            const key = fmtDate(d);
            const isSel = key === selKey;
            const isToday = key === fmtDate(today);
            const future = d > today;
            return (
              <button
                key={i}
                onClick={() => setSelected(d)}
                className={`relative aspect-square rounded-2xl text-sm font-semibold ${PHASE_BG[ph]} ${future ? "opacity-55" : ""} ${isSel ? "ring-2 ring-ink" : ""}`}
              >
                <span className={isToday ? "underline decoration-2 underline-offset-2" : ""}>{d.getDate()}</span>
                {workoutDays.has(key) && (
                  <span className="absolute right-1 bottom-1 grid h-3.5 w-3.5 place-items-center rounded-full bg-ink">
                    <Check className="h-2.5 w-2.5 text-ink-foreground" />
                  </span>
                )}
                {logMap.get(key)?.period_start && <span className="absolute top-1 left-1 h-1.5 w-1.5 rounded-full bg-ink" />}
              </button>
            );
          })}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          {(Object.keys(PHASES) as Phase[]).map((p) => (
            <span key={p} className="flex items-center gap-2"><span className={`h-3 w-3 rounded-full ${PHASE_BG[p]}`} />{PHASES[p].short}</span>
          ))}
          <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-ink" />Treino feito</span>
          <span className="flex items-center gap-2 opacity-60">Dias claros = previsão</span>
        </div>
      </section>

      <section className={`mt-4 rounded-3xl p-5 ${PHASE_BG[selPhase]}`}>
        <p className="text-sm font-semibold text-ink/70">
          {selected.getDate()} de {MONTHS[selected.getMonth()].toLowerCase()} · dia {selDay} do ciclo
        </p>
        <h3 className="mt-1 text-2xl font-bold">{PHASES[selPhase].name}</h3>
        <p className="mt-2 text-sm"><strong>Como o corpo pode estar:</strong> {PHASES[selPhase].feeling}</p>
        <p className="mt-2 text-sm"><strong>Sugestão de treino:</strong> {PHASES[selPhase].recommendation}</p>
        <p className="mt-2 text-xs text-ink/60">É só uma sugestão — você sempre pode escolher outro treino.</p>
      </section>

      {selected <= today && (
        <LogForm
          key={selKey}
          dateKey={selKey}
          initial={selLog}
          onSaved={() => invalidate("cycle_logs", "cycle")}
        />
      )}
    </AppShell>
  );
}

type Log = { period_start: boolean; energy: string | null; mood: string | null; symptoms: string[] };

function LogForm({ dateKey, initial, onSaved }: { dateKey: string; initial?: Log; onSaved: () => void }) {
  const [periodStart, setPeriodStart] = useState(initial?.period_start ?? false);
  const [energy, setEnergy] = useState(initial?.energy ?? "");
  const [mood, setMood] = useState(initial?.mood ?? "");
  const [symptoms, setSymptoms] = useState<string[]>(initial?.symptoms ?? []);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const id = await uid();
    const { error } = await supabase.from("cycle_logs").upsert(
      { user_id: id, log_date: dateKey, period_start: periodStart, energy: energy || null, mood: mood || null, symptoms },
      { onConflict: "user_id,log_date" },
    );
    if (!error && periodStart) {
      const { data: cur } = await supabase.from("cycle_settings").select("*").eq("user_id", id).maybeSingle();
      if (!cur?.last_period_start || cur.last_period_start < dateKey) {
        await supabase.from("cycle_settings").upsert({
          user_id: id,
          last_period_start: dateKey,
          cycle_length: cur?.cycle_length ?? 28,
          period_length: cur?.period_length ?? 5,
        });
      }
    }
    setSaving(false);
    if (error) return toast.error("Não foi possível salvar.");
    toast.success("Registro salvo 💛");
    onSaved();
  }

  const chip = (on: boolean) => `rounded-full px-4 py-2 text-sm font-semibold ${on ? "bg-ink text-ink-foreground" : "bg-background"}`;

  return (
    <section className="mt-4 space-y-4 rounded-3xl bg-surface p-5">
      <h3 className="text-lg font-bold">Como você se sentiu?</h3>
      <label className="flex items-center justify-between rounded-2xl bg-blush px-4 py-3">
        <span className="font-semibold">Minha menstruação começou neste dia</span>
        <input type="checkbox" checked={periodStart} onChange={(e) => setPeriodStart(e.target.checked)} className="h-5 w-5 accent-[var(--primary)]" />
      </label>
      <div>
        <p className="mb-2 text-sm font-semibold">Energia</p>
        <div className="flex flex-wrap gap-2">{ENERGY.map((e) => <button key={e} onClick={() => setEnergy(e)} className={chip(energy === e)}>{e}</button>)}</div>
      </div>
      <div>
        <p className="mb-2 text-sm font-semibold">Humor</p>
        <div className="flex gap-2">{MOOD.map((m) => <button key={m} onClick={() => setMood(m)} className={`${chip(mood === m)} text-xl`}>{m}</button>)}</div>
      </div>
      <div>
        <p className="mb-2 text-sm font-semibold">Sintomas</p>
        <div className="flex flex-wrap gap-2">
          {SYMPTOMS.map((x) => (
            <button key={x} onClick={() => setSymptoms(symptoms.includes(x) ? symptoms.filter((y) => y !== x) : [...symptoms, x])} className={chip(symptoms.includes(x))}>{x}</button>
          ))}
        </div>
      </div>
      <button disabled={saving} onClick={save} className="w-full rounded-full bg-primary py-3.5 font-bold text-primary-foreground disabled:opacity-60">
        Salvar registro
      </button>
      <p className="text-center text-xs text-foreground/60">🔒 Seus dados do ciclo são privados e nunca aparecem na comunidade.</p>
    </section>
  );
}
