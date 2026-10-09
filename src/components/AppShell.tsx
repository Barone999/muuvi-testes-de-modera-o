import { Link, useNavigate } from "@tanstack/react-router";
import { Home, Footprints, CalendarHeart, Salad, Users, UserRound, Menu, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useProfile } from "@/lib/data";

const NAV = [
  { to: "/inicio", label: "Início", icon: Home },
  { to: "/treinos", label: "Treinos", icon: Footprints },
  { to: "/ciclo", label: "Ciclo", icon: CalendarHeart },
  { to: "/receitas", label: "Receitas", icon: Salad },
  { to: "/comunidade", label: "Comunidade", icon: Users },
] as const;

export function AppShell({ title, children }: { title?: string; children: ReactNode }) {
  const { data: profile, isSuccess } = useProfile();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (isSuccess && profile && !profile.onboarded) navigate({ to: "/onboarding", replace: true });
  }, [isSuccess, profile, navigate]);

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background pb-24">
      <header className="sticky top-0 z-20 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 bg-background/90 px-5 pt-5 pb-3 backdrop-blur">
        <div className="min-w-0">
          <p className="font-display text-xl font-bold tracking-tight text-ink">muuvi</p>
          {title && <h1 className="truncate text-2xl font-bold">{title}</h1>}
        </div>
        <Link
          to="/perfil"
          aria-label="Perfil"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blush text-ink"
        >
          <UserRound className="h-5 w-5" />
        </Link>
      </header>
      <main className="px-5">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md px-4 pb-4">
        <div className="rounded-3xl bg-ink shadow-lg">
          <div
            className={`grid transition-all duration-300 ease-out ${
              menuOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <div className="grid grid-cols-5 px-1 pt-2">
                {NAV.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMenuOpen(false)}
                    className={`flex flex-col items-center gap-1 rounded-2xl py-1.5 text-[11px] text-ink-foreground/60 transition-transform duration-300 ease-out ${
                      menuOpen ? "translate-y-0" : "translate-y-2"
                    }`}
                    activeProps={{ className: "!text-primary" }}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            className="flex w-full items-center justify-center gap-2 rounded-3xl py-2.5 text-sm font-semibold text-primary transition-colors active:bg-ink-foreground/10"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            Menuu
          </button>
        </div>
      </nav>
    </div>
  );
}

export function Disclaimer({ className = "" }: { className?: string }) {
  return (
    <p className={`rounded-2xl bg-sage/70 p-3 text-xs text-foreground/80 ${className}`}>
      As recomendações do Muuvi são informativas e não substituem orientação médica.
    </p>
  );
}
