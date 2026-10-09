import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Clock, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { PHASES, type Phase } from "@/lib/cycle";
import { uid, useFavorites, useInvalidate } from "@/lib/data";
import { RECIPES, type Recipe } from "@/lib/recipes";

export const Route = createFileRoute("/_authenticated/receitas")({
  head: () => ({ meta: [{ title: "Receitas — Muuvi" }, { name: "description", content: "Receitas pré e pós-treino." }] }),
  component: Receitas,
});

function Receitas() {
  const [moment, setMoment] = useState<"" | "pre" | "pos">("");
  const [time, setTime] = useState(0);
  const [phase, setPhase] = useState<"" | Phase>("");
  const [onlyFav, setOnlyFav] = useState(false);
  const [open, setOpen] = useState<Recipe | null>(null);
  const { data: favs = new Set<string>() } = useFavorites();
  const invalidate = useInvalidate();

  async function toggleFav(id: string) {
    const user_id = await uid();
    if (favs.has(id)) await supabase.from("recipe_favorites").delete().eq("user_id", user_id).eq("recipe_id", id);
    else await supabase.from("recipe_favorites").insert({ user_id, recipe_id: id });
    invalidate("favorites");
  }

  const list = RECIPES.filter(
    (r) => (!moment || r.moment === moment) && (!time || r.minutes <= time) && (!phase || r.phases.includes(phase)) && (!onlyFav || favs.has(r.id)),
  );
  const chip = (on: boolean) => `shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${on ? "bg-ink text-ink-foreground" : "bg-surface"}`;

  return (
    <AppShell title="Receitas">
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2">
        <button className={chip(!moment)} onClick={() => setMoment("")}>Todas</button>
        <button className={chip(moment === "pre")} onClick={() => setMoment("pre")}>Pré-treino</button>
        <button className={chip(moment === "pos")} onClick={() => setMoment("pos")}>Pós-treino</button>
        <button className={chip(time === 5)} onClick={() => setTime(time === 5 ? 0 : 5)}>Até 5 min</button>
        <button className={chip(onlyFav)} onClick={() => setOnlyFav(!onlyFav)}>♥ Favoritas</button>
      </div>
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-4">
        {(Object.keys(PHASES) as Phase[]).map((p) => (
          <button key={p} className={chip(phase === p)} onClick={() => setPhase(phase === p ? "" : p)}>{PHASES[p].short}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {list.map((r) => (
          <div key={r.id} className="overflow-hidden rounded-3xl bg-surface">
            <button onClick={() => setOpen(r)} className="block w-full text-left">
              <img src={r.image} alt={r.title} className="aspect-square w-full object-cover" loading="lazy" />
              <div className="p-3">
                <p className="text-xs font-semibold text-bronze">{r.moment === "pre" ? "Pré" : "Pós"}-treino</p>
                <p className="font-display text-sm font-bold leading-tight text-ink">{r.title}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-foreground/60"><Clock className="h-3 w-3" />{r.minutes} min</p>
              </div>
            </button>
          </div>
        ))}
        {!list.length && <p className="col-span-2 py-10 text-center text-foreground/60">Nenhuma receita com esses filtros.</p>}
      </div>

      {open && (
        <div className="fixed inset-0 z-40 flex items-end bg-ink/40" onClick={() => setOpen(null)}>
          <div className="mx-auto max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-background" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <img src={open.image} alt={open.title} className="aspect-video w-full object-cover" />
              <button aria-label="Fechar" onClick={() => setOpen(null)} className="absolute top-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-background"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <h2 className="text-2xl font-bold">{open.title}</h2>
                <button aria-label="Favoritar" onClick={() => toggleFav(open.id)} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blush">
                  <Heart className={`h-5 w-5 text-ink ${favs.has(open.id) ? "fill-current" : ""}`} />
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-sage px-3 py-1">{open.minutes} min</span>
                {open.phases.map((p) => <span key={p} className="rounded-full bg-surface px-3 py-1">{PHASES[p].short}</span>)}
              </div>
              <h3 className="mt-5 font-bold">Ingredientes</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{open.ingredients.map((i) => <li key={i}>{i}</li>)}</ul>
              <h3 className="mt-5 font-bold">Modo de preparo</h3>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">{open.steps.map((s) => <li key={s}>{s}</li>)}</ol>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
