import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate, type CycleSettings } from "./cycle";

export function useUser() {
  return useQuery({
    queryKey: ["user"],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
    staleTime: 60_000,
  });
}

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Sem sessão");
  return data.user.id;
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const id = await uid();
      const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
      return data;
    },
  });
}

/** Demo cycle used when she skipped cycle data — clearly marked as example in UI. */
export function demoCycle(): CycleSettings {
  const d = new Date();
  d.setDate(d.getDate() - 8);
  return { last_period_start: fmtDate(d), cycle_length: 28, period_length: 5 };
}

export function useCycle() {
  return useQuery({
    queryKey: ["cycle"],
    queryFn: async () => {
      const id = await uid();
      const { data } = await supabase.from("cycle_settings").select("*").eq("user_id", id).maybeSingle();
      if (data?.last_period_start) return { settings: data as CycleSettings, isDemo: false };
      return { settings: demoCycle(), isDemo: true };
    },
  });
}

export function useCycleLogs() {
  return useQuery({
    queryKey: ["cycle_logs"],
    queryFn: async () => {
      const id = await uid();
      const { data } = await supabase.from("cycle_logs").select("*").eq("user_id", id);
      return data ?? [];
    },
  });
}

export function useSessions() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const id = await uid();
      const { data } = await supabase
        .from("workout_sessions")
        .select("*")
        .eq("user_id", id)
        .order("completed_at", { ascending: false });
      return data ?? [];
    },
  });
}

export function useFavorites() {
  return useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      const id = await uid();
      const { data } = await supabase.from("recipe_favorites").select("recipe_id").eq("user_id", id);
      return new Set((data ?? []).map((r) => r.recipe_id));
    },
  });
}

export function useInvalidate() {
  const qc = useQueryClient();
  return (...keys: string[]) => keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
}

export { uid };
