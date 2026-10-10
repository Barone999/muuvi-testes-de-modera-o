ALTER TABLE public.cycle_logs ADD COLUMN IF NOT EXISTS flow text;
ALTER TABLE public.cycle_logs ADD CONSTRAINT cycle_logs_flow_check CHECK (flow IS NULL OR flow IN ('Muito leve','Leve','Moderado','Intenso'));
ALTER TABLE public.cycle_logs ADD COLUMN IF NOT EXISTS period_ended boolean NOT NULL DEFAULT false;