import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, Square, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uid, useInvalidate } from "@/lib/data";
import { buildIntervals, type IntervalKind } from "@/lib/program";

export const Route = createFileRoute("/_authenticated/treino/$week/$session")({
  head: () => ({ meta: [{ title: "Treino ativo — Muuvi" }, { name: "description", content: "Seu treino em andamento." }] }),
  component: Treino,
});

const LABEL: Record<IntervalKind, string> = { warmup: "AQUEÇA", run: "CORRA", walk: "CAMINHE", cooldown: "DESACELERE" };
const BG: Record<IntervalKind, string> = { warmup: "bg-sage", run: "bg-primary", walk: "bg-blush", cooldown: "bg-sage" };
const HINT: Record<IntervalKind, string> = {
  warmup: "Caminhada tranquila para acordar o corpo",
  run: "Num ritmo em que dá para conversar",
  walk: "Respire fundo e recupere",
  cooldown: "Caminhe devagar e solte o corpo",
};

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

function Treino() {
  const { week, session } = Route.useParams();
  const w = Number(week);
  const intervals = useMemo(() => buildIntervals(w), [w]);
  const total = intervals.reduce((a, i) => a + i.seconds, 0);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const tick = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    tick.current = window.setInterval(() => setElapsed((e) => Math.min(e + 1, total)), 1000);
    return () => { if (tick.current) clearInterval(tick.current); };
  }, [running, total]);

  useEffect(() => {
    if (elapsed >= total && running) { setRunning(false); setFinished(true); }
  }, [elapsed, total, running]);

  let acc = 0;
  let idx = 0;
  for (; idx < intervals.length; idx++) {
    if (elapsed < acc + intervals[idx]!.seconds) break;
    acc += intervals[idx]!.seconds;
  }
  const cur = intervals[Math.min(idx, intervals.length - 1)]!;
  const remaining = Math.max(0, acc + cur.seconds - elapsed);
  const prevKind = useRef(cur.kind);
  useEffect(() => {
    if (prevKind.current !== cur.kind && running && "vibrate" in navigator) navigator.vibrate?.(300);
    prevKind.current = cur.kind;
  }, [cur.kind, running]);

  if (finished) return <Concluido week={w} session={Number(session)} minutes={Math.max(1, Math.round(elapsed / 60))} />;

  return (
    <div className={`mx-auto flex min-h-screen max-w-md flex-col px-6 py-6 transition-colors duration-500 ${BG[cur.kind]}`}>
      <div className="flex items-center justify-between">
        <Link to="/inicio" aria-label="Fechar" className="grid h-10 w-10 place-items-center rounded-full bg-background/60"><X className="h-5 w-5" /></Link>
        <p className="font-semibold text-ink">{w === 0 ? "Caminhada leve" : `Semana ${w} · Treino ${session}`}</p>
        <span className="w-10" />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="text-sm font-semibold text-ink/60">Intervalo {Math.min(idx + 1, intervals.length)} de {intervals.length}</p>
        <h1 className="mt-2 font-display text-7xl font-bold tracking-tight text-ink">{LABEL[cur.kind]}</h1>
        <p className="mt-2 text-ink/70">{HINT[cur.kind]}</p>
        <p className="mt-10 font-display text-8xl font-bold tabular-nums text-ink">{fmt(remaining)}</p>
      </div>

      <div className="mb-6">
        <div className="h-3 overflow-hidden rounded-full bg-background/60">
          <div className="h-full rounded-full bg-ink transition-all" style={{ width: `${(elapsed / total) * 100}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-sm font-semibold text-ink/70">
          <span>{fmt(elapsed)}</span><span>{fmt(total)}</span>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-3">
        <button onClick={() => setRunning(!running)} className="flex items-center justify-center gap-2 rounded-full bg-ink py-5 text-lg font-bold text-ink-foreground">
          {running ? <><Pause className="h-5 w-5" /> Pausar</> : <><Play className="h-5 w-5 fill-current" /> {elapsed ? "Continuar" : "Iniciar"}</>}
        </button>
        <button
          onClick={() => { setRunning(false); if (elapsed > 0) setFinished(true); }}
          className="flex items-center gap-2 rounded-full bg-background/70 px-6 font-bold text-ink"
        >
          <Square className="h-4 w-4 fill-current" /> Finalizar
        </button>
      </div>
    </div>
  );
}

function Concluido({ week, session, minutes }: { week: number; session: number; minutes: number }) {
  const [saved, setSaved] = useState<string | null>(null);
  const navigate = useNavigate();
  const invalidate = useInvalidate();
  const idRef = useRef<string | null>(null);

  useEffect(() => {
    (async () => {
      const user_id = await uid();
      const { data, error } = await supabase.from("workout_sessions").insert({ user_id, week, session, minutes }).select("id").single();
      if (error) toast.error("Não conseguimos salvar o treino.");
      idRef.current = data?.id ?? null;
      invalidate("sessions");
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function feel(f: string) {
    setSaved(f);
    if (idRef.current) await supabase.from("workout_sessions").update({ feeling: f }).eq("id", idRef.current);
    invalidate("sessions");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-blush px-6 text-center">
      <div className="text-7xl">🎉</div>
      <h1 className="mt-4 text-4xl font-bold">Você conseguiu!</h1>
      <p className="mt-2 text-lg text-ink/80">{minutes} minutos de movimento. Seu corpo agradece. 💛</p>
      <p className="mt-10 font-semibold text-ink">Como você se sentiu?</p>
      <div className="mt-3 grid w-full grid-cols-3 gap-3">
        {[["otimo", "😄", "Ótimo"], ["ok", "🙂", "Ok"], ["dificil", "😮‍💨", "Difícil"]].map(([v, e, l]) => (
          <button key={v} onClick={() => feel(v!)} className={`rounded-3xl py-4 font-semibold ${saved === v ? "bg-ink text-ink-foreground" : "bg-background"}`}>
            <span className="block text-3xl">{e}</span>{l}
          </button>
        ))}
      </div>
      {saved === "dificil" && <p className="mt-4 text-sm text-ink/80">Tudo bem! Repetir a semana é totalmente válido. Vá no seu tempo.</p>}
      <button onClick={() => navigate({ to: "/inicio" })} className="mt-10 w-full rounded-full bg-primary py-4 font-bold text-primary-foreground">
        Voltar ao início
      </button>
    </div>
  );
}
