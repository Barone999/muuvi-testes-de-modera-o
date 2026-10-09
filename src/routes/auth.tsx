import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ mode: s.mode === "login" ? "login" : undefined }) as { mode?: "login" },
  head: () => ({
    meta: [
      { title: "Entrar — Muuvi" },
      { name: "description", content: "Entre ou crie sua conta no Muuvi." },
      { property: "og:title", content: "Entrar — Muuvi" },
      { property: "og:description", content: "Entre ou crie sua conta no Muuvi." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const [isLogin, setIsLogin] = useState(mode === "login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return toast.error("E-mail ou senha incorretos.");
      navigate({ to: "/inicio" });
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin, data: { display_name: name || undefined } },
      });
      setLoading(false);
      if (error) return toast.error(error.message);
      if (data.session) navigate({ to: "/onboarding" });
      else setSent(true);
    }
  }

  const input = "w-full rounded-2xl border border-border bg-surface px-4 py-3.5 outline-none focus:border-bronze";

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <p className="font-display text-2xl font-bold text-ink">muuvi</p>
      <h1 className="mt-6 text-3xl font-bold">{isLogin ? "Que bom te ver de novo" : "Vamos começar juntas"}</h1>
      {sent ? (
        <div className="mt-6 rounded-3xl bg-sage p-5">
          <p className="font-semibold text-ink">Confira seu e-mail 💌</p>
          <p className="mt-1 text-sm">Enviamos um link para confirmar sua conta. Depois é só voltar e entrar.</p>
          <button className="mt-4 text-sm font-bold text-bronze" onClick={() => { setSent(false); setIsLogin(true); }}>
            Ir para o login
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-3">
          {!isLogin && <input className={input} placeholder="Como quer ser chamada?" value={name} onChange={(e) => setName(e.target.value)} />}
          <input className={input} type="email" required placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className={input} type="password" required minLength={6} placeholder="Senha (mín. 6 caracteres)" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button disabled={loading} className="w-full rounded-full bg-primary py-4 font-bold text-primary-foreground disabled:opacity-60">
            {loading ? "Aguarde..." : isLogin ? "Entrar" : "Criar conta"}
          </button>
          <button type="button" onClick={() => setIsLogin(!isLogin)} className="w-full py-2 text-sm font-semibold text-bronze">
            {isLogin ? "Ainda não tenho conta" : "Já tenho conta"}
          </button>
        </form>
      )}
    </div>
  );
}
