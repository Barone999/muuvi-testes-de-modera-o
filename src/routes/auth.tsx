import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ mode: s["mode"] === "login" ? "login" : undefined }) as { mode?: "login" },
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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data.user) navigate({ to: "/inicio" }); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: "/inicio" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function google() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/auth` });
    if (result.error) { setLoading(false); toast.error("Não foi possível entrar com o Google."); return; }
    if (result.redirected) return;
    navigate({ to: "/inicio" });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) { toast.error("E-mail ou senha incorretos."); return; }
      navigate({ to: "/inicio" });
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin, data: { display_name: name || undefined } },
      });
      setLoading(false);
      if (error) { toast.error(error.message); return; }
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
        <>
        <button type="button" onClick={google} disabled={loading} className="mt-6 flex w-full items-center justify-center gap-3 rounded-full border border-border bg-surface py-3.5 font-bold text-ink disabled:opacity-60">
          <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
          Continuar com o Google
        </button>
        <p className="mt-4 text-center text-xs text-foreground/60">ou continue com e-mail</p>
        <form onSubmit={submit} className="mt-3 space-y-3">
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
        </>
      )}
    </div>
  );
}
