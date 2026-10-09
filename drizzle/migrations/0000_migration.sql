
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT 'Corredora',
  goal text,
  days_per_week int NOT NULL DEFAULT 3,
  level text,
  onboarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)));
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.cycle_settings (
  user_id uuid PRIMARY KEY,
  last_period_start date,
  cycle_length int NOT NULL DEFAULT 28,
  period_length int NOT NULL DEFAULT 5,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cycle_settings TO authenticated;
GRANT ALL ON public.cycle_settings TO service_role;
ALTER TABLE public.cycle_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cycle" ON public.cycle_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.cycle_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  log_date date NOT NULL,
  period_start boolean NOT NULL DEFAULT false,
  energy text,
  mood text,
  symptoms text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, log_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cycle_logs TO authenticated;
GRANT ALL ON public.cycle_logs TO service_role;
ALTER TABLE public.cycle_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own logs" ON public.cycle_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.workout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  week int NOT NULL,
  session int NOT NULL,
  minutes int NOT NULL DEFAULT 0,
  feeling text,
  completed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_sessions TO authenticated;
GRANT ALL ON public.workout_sessions TO service_role;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sessions" ON public.workout_sessions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.recipe_favorites (
  user_id uuid NOT NULL,
  recipe_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, recipe_id)
);
GRANT SELECT, INSERT, DELETE ON public.recipe_favorites TO authenticated;
GRANT ALL ON public.recipe_favorites TO service_role;
ALTER TABLE public.recipe_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own favs" ON public.recipe_favorites FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  author_name text NOT NULL,
  content text NOT NULL,
  image_url text,
  image_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read posts" ON public.posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert own post" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete own post" ON public.posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.post_likes (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  PRIMARY KEY (post_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.post_likes TO authenticated;
GRANT ALL ON public.post_likes TO service_role;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read likes" ON public.post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "own like ins" ON public.post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own like del" ON public.post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  author_name text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.post_comments TO authenticated;
GRANT ALL ON public.post_comments TO service_role;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read comments" ON public.post_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "own comment ins" ON public.post_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own comment del" ON public.post_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.post_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);
GRANT INSERT ON public.post_reports TO authenticated;
GRANT ALL ON public.post_reports TO service_role;
ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own report ins" ON public.post_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

INSERT INTO public.posts (user_id, author_name, content, image_url, created_at) VALUES
('00000000-0000-0000-0000-000000000001','Camila','Completei a semana 2! Achei que não ia conseguir, mas fui no meu ritmo e deu certo. 💛','https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800', now() - interval '3 hours'),
('00000000-0000-0000-0000-000000000002','Juliana','Hoje estava na fase menstrual e fiz só uma caminhada leve de 20 min. Respeitar o corpo também é treinar!',NULL, now() - interval '1 day'),
('00000000-0000-0000-0000-000000000003','Bia','Primeira corrida no parque com o sol nascendo. Que sensação boa! Bora juntas?','https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800', now() - interval '2 days');

CREATE POLICY "post images read auth" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'post-images');
CREATE POLICY "post images upload own" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'post-images' AND (storage.foldername(name))[1] = auth.uid()::text);
