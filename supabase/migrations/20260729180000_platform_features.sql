-- ==========================================
-- MIGRATION: DIGITs Nigeria Election Watch Platform Features
-- ==========================================

-- 1. LIVE STREAMS & PUBLIC TILE SWITCHER (1-6 Tiles)
CREATE TABLE IF NOT EXISTS public.live_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  observer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  observer_name TEXT NOT NULL,
  state TEXT NOT NULL,
  lga TEXT NOT NULL,
  polling_unit TEXT,
  stream_title TEXT NOT NULL,
  stream_url TEXT NOT NULL,
  livekit_room TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  tile_slot INT CHECK (tile_slot >= 1 AND tile_slot <= 6),
  viewer_count INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('offline', 'live', 'paused', 'ended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.live_streams TO anon, authenticated;
GRANT ALL ON public.live_streams TO authenticated;
GRANT ALL ON public.live_streams TO service_role;
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "live_streams_select_all" ON public.live_streams
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "live_streams_insert_observer" ON public.live_streams
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = observer_id OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'control_center_operator')
  );

CREATE POLICY "live_streams_update_operator" ON public.live_streams
  FOR UPDATE TO authenticated USING (
    auth.uid() = observer_id OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'control_center_operator')
  );


-- 2. i-WITNESS REPORTS (Media Storage & Geolocation)
CREATE TABLE IF NOT EXISTS public.iwitness_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_name TEXT NOT NULL,
  nin TEXT,
  state TEXT NOT NULL,
  lga TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  media_type TEXT NOT NULL CHECK (media_type IN ('video', 'image')),
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'flagged', 'broadcasted', 'archived')),
  triage_category TEXT DEFAULT 'general' CHECK (triage_category IN ('general', 'violence', 'logistics', 'vote_buying', 'ballot_snatching', 'peaceful')),
  severity_score INT DEFAULT 1 CHECK (severity_score BETWEEN 1 AND 5),
  sha256_hash TEXT,
  expires_from_user_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  is_public_broadcast BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.iwitness_reports TO anon, authenticated;
GRANT INSERT ON public.iwitness_reports TO authenticated;
GRANT ALL ON public.iwitness_reports TO service_role;
ALTER TABLE public.iwitness_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "iwitness_select_public" ON public.iwitness_reports
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "iwitness_insert_authenticated" ON public.iwitness_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "iwitness_update_admins" ON public.iwitness_reports
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'control_center_operator')
  );


-- 3. DIGEO TRAINING MODULES & CERTIFICATION
CREATE TABLE IF NOT EXISTS public.digeo_training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_number INT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  content_markdown TEXT NOT NULL,
  video_url TEXT,
  quiz_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  duration_minutes INT DEFAULT 15,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.digeo_trainee_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.digeo_training_modules(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  quiz_score INT DEFAULT 0,
  completed_at TIMESTAMPTZ,
  UNIQUE (user_id, module_id)
);

CREATE TABLE IF NOT EXISTS public.digeo_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  certificate_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  state TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  qr_code_hash TEXT NOT NULL
);

GRANT SELECT ON public.digeo_training_modules TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.digeo_trainee_progress TO authenticated;
GRANT SELECT ON public.digeo_certificates TO anon, authenticated;
GRANT ALL ON public.digeo_training_modules, public.digeo_trainee_progress, public.digeo_certificates TO service_role;

ALTER TABLE public.digeo_training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digeo_trainee_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digeo_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "training_modules_select" ON public.digeo_training_modules FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "trainee_progress_select_own" ON public.digeo_trainee_progress FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "trainee_progress_upsert_own" ON public.digeo_trainee_progress FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "trainee_progress_update_own" ON public.digeo_trainee_progress FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "certificates_select" ON public.digeo_certificates FOR SELECT TO anon, authenticated USING (true);

-- Storage bucket setup statement (executed via API or Supabase client)
INSERT INTO storage.buckets (id, name, public) VALUES ('iwitness-reports', 'iwitness-reports', true) ON CONFLICT (id) DO NOTHING;
