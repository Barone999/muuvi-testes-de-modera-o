import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Muuvi — comece a correr no ritmo do seu ciclo" },
      { name: "description", content: "Programa de corrida de 8 semanas para mulheres iniciantes, com recomendações por fase do ciclo." },
      { property: "og:title", content: "Muuvi — comece a correr no ritmo do seu ciclo" },
      { property: "og:description", content: "Corrida leve, sem pressão, respeitando cada fase do seu corpo." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/inicio", replace: true });
    });
  }, [navigate]);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-between px-6 py-10">
      <p className="font-display text-2xl font-bold text-ink">muuvi</p>
      <div>
        <div className="mb-8 flex gap-2">
          {["bg-phase-menstrual", "bg-phase-folicular", "bg-phase-ovulatoria", "bg-phase-lutea"].map((c) => (
            <span key={c} className={`h-16 flex-1 rounded-full ${c}`} />
          ))}
        </div>
        <h1 className="text-4xl font-bold leading-tight">Correr no seu ritmo, em cada fase.</h1>
        <p className="mt-4 text-lg text-foreground/80">
          Um programa de 8 semanas para iniciantes que adapta as sugestões ao seu ciclo. Sem pressão, com carinho.
        </p>
      </div>
      <div className="space-y-3">
        <Link to="/auth" className="block rounded-full bg-primary py-4 text-center font-bold text-primary-foreground">
          Começar
        </Link>
        <Link to="/auth" search={{ mode: "login" }} className="block py-2 text-center text-sm font-semibold text-bronze">
          Já tenho conta
        </Link>
      </div>
    </div>
  );
}
