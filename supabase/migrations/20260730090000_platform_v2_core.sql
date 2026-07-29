-- ============================================================================
-- DIGITs Nigeria Election Watch — Platform v2 (core)
-- Identity fields, staff helpers, live streaming state, public comments,
-- operator-controlled broadcast layout, audit trail and notifications.
-- ============================================================================

-- ------------------------------------------------------------------ profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS nin TEXT,
  ADD COLUMN IF NOT EXISTS nin_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ward TEXT,
  ADD COLUMN IF NOT EXISTS polling_unit TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS preferred_language TEXT NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS notify_email BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_push BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

-- NIN is exactly 11 digits (NIMC standard). Enforced, but nullable until set.
DO $$ BEGIN
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_nin_format CHECK (nin IS NULL OR nin ~ '^[0-9]{11}$');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_nin_unique ON public.profiles (nin) WHERE nin IS NOT NULL;

-- Keep the signup trigger in step with the widened profile shape.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET email = COALESCE(public.profiles.email, EXCLUDED.email);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'viewer')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END; $$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- --------------------------------------------------------- staff role helpers
-- Argument-free so EXECUTE can be granted safely: callers can only ever ask
-- about themselves.
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('super_admin','admin','control_center_operator','observer_coordinator','reviewer')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_broadcast_operator()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('super_admin','admin','control_center_operator')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('super_admin','admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.my_roles()
RETURNS SETOF public.app_role LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid()
$$;

GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_broadcast_operator() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_roles() TO authenticated;

-- Staff need to see the whole roster to run the observer network.
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);

-- Admins may correct any profile (e.g. clear a bad NIN) without impersonating.
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ------------------------------------------------------------- live_streams+
-- Migration 20260729180000 creates live_streams; widen it for real LiveKit use.
ALTER TABLE public.live_streams
  ADD COLUMN IF NOT EXISTS hls_url TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS livekit_identity TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'livekit',
  ADD COLUMN IF NOT EXISTS ward TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'polling_unit',
  ADD COLUMN IF NOT EXISTS priority INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS peak_viewers INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_heartbeat_at TIMESTAMPTZ;

DO $$ BEGIN
  ALTER TABLE public.live_streams
    ADD CONSTRAINT live_streams_source_check CHECK (source IN ('livekit','hls','file','iwitness'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- stream_url is only meaningful for hls/file sources; LiveKit rooms have none.
ALTER TABLE public.live_streams ALTER COLUMN stream_url DROP NOT NULL;

CREATE INDEX IF NOT EXISTS live_streams_public_idx
  ON public.live_streams (is_approved, status, tile_slot);
CREATE INDEX IF NOT EXISTS live_streams_observer_idx ON public.live_streams (observer_id);

-- Migration 20260729180000 handed authenticated ALL on live_streams; narrow it.
REVOKE ALL ON public.live_streams FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON public.live_streams TO authenticated;
GRANT SELECT ON public.live_streams TO anon;

DROP POLICY IF EXISTS "live_streams_select_all" ON public.live_streams;
CREATE POLICY "live_streams_select_public" ON public.live_streams
  FOR SELECT TO anon USING (is_approved = true AND status IN ('live','paused'));

DROP POLICY IF EXISTS "live_streams_select_auth" ON public.live_streams;
CREATE POLICY "live_streams_select_auth" ON public.live_streams
  FOR SELECT TO authenticated
  USING ((is_approved = true AND status IN ('live','paused')) OR observer_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "live_streams_insert_observer" ON public.live_streams;
CREATE POLICY "live_streams_insert_observer" ON public.live_streams
  FOR INSERT TO authenticated
  WITH CHECK (observer_id = auth.uid() OR public.is_broadcast_operator());

DROP POLICY IF EXISTS "live_streams_update_operator" ON public.live_streams;
CREATE POLICY "live_streams_update_own" ON public.live_streams
  FOR UPDATE TO authenticated USING (observer_id = auth.uid()) WITH CHECK (observer_id = auth.uid());
CREATE POLICY "live_streams_update_operator" ON public.live_streams
  FOR UPDATE TO authenticated USING (public.is_broadcast_operator()) WITH CHECK (public.is_broadcast_operator());

DROP TRIGGER IF EXISTS trg_live_streams_updated ON public.live_streams;
CREATE TRIGGER trg_live_streams_updated
BEFORE UPDATE ON public.live_streams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------- broadcast_state (1 row)
-- The public grid layout is operator-controlled; viewers read it, operators write.
CREATE TABLE IF NOT EXISTS public.broadcast_state (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id),
  tile_count INT NOT NULL DEFAULT 4 CHECK (tile_count BETWEEN 1 AND 6),
  slot_1 UUID REFERENCES public.live_streams(id) ON DELETE SET NULL,
  slot_2 UUID REFERENCES public.live_streams(id) ON DELETE SET NULL,
  slot_3 UUID REFERENCES public.live_streams(id) ON DELETE SET NULL,
  slot_4 UUID REFERENCES public.live_streams(id) ON DELETE SET NULL,
  slot_5 UUID REFERENCES public.live_streams(id) ON DELETE SET NULL,
  slot_6 UUID REFERENCES public.live_streams(id) ON DELETE SET NULL,
  headline TEXT,
  ticker_message TEXT,
  is_public_live BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.broadcast_state (id, tile_count, headline, ticker_message)
VALUES (true, 4, 'Live from polling units across Nigeria',
        'DIGITs Election Watch — citizen observation, streamed and verified in real time.')
ON CONFLICT (id) DO NOTHING;

GRANT SELECT ON public.broadcast_state TO anon, authenticated;
GRANT UPDATE ON public.broadcast_state TO authenticated;
GRANT ALL ON public.broadcast_state TO service_role;
ALTER TABLE public.broadcast_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "broadcast_state_select" ON public.broadcast_state;
CREATE POLICY "broadcast_state_select" ON public.broadcast_state
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "broadcast_state_update" ON public.broadcast_state;
CREATE POLICY "broadcast_state_update" ON public.broadcast_state
  FOR UPDATE TO authenticated USING (public.is_broadcast_operator()) WITH CHECK (public.is_broadcast_operator());

-- ---------------------------------------------------------- stream_comments
CREATE TABLE IF NOT EXISTS public.stream_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID REFERENCES public.live_streams(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'public-live',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  body TEXT NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 500),
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  hidden_by UUID REFERENCES auth.users(id),
  hidden_reason TEXT,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stream_comments_feed_idx
  ON public.stream_comments (channel, created_at DESC) WHERE is_hidden = false;
CREATE INDEX IF NOT EXISTS stream_comments_stream_idx ON public.stream_comments (stream_id, created_at DESC);

GRANT SELECT ON public.stream_comments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.stream_comments TO authenticated;
GRANT ALL ON public.stream_comments TO service_role;
ALTER TABLE public.stream_comments ENABLE ROW LEVEL SECURITY;

-- Anyone may read the conversation; only signed-in users may add to it.
DROP POLICY IF EXISTS "stream_comments_select" ON public.stream_comments;
CREATE POLICY "stream_comments_select" ON public.stream_comments
  FOR SELECT TO anon, authenticated USING (is_hidden = false);
DROP POLICY IF EXISTS "stream_comments_select_staff" ON public.stream_comments;
CREATE POLICY "stream_comments_select_staff" ON public.stream_comments
  FOR SELECT TO authenticated USING (public.is_staff() OR user_id = auth.uid());

DROP POLICY IF EXISTS "stream_comments_insert" ON public.stream_comments;
CREATE POLICY "stream_comments_insert" ON public.stream_comments
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "stream_comments_delete_own" ON public.stream_comments;
CREATE POLICY "stream_comments_delete_own" ON public.stream_comments
  FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "stream_comments_moderate" ON public.stream_comments;
CREATE POLICY "stream_comments_moderate" ON public.stream_comments
  FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

-- Rate limit: at most 6 comments per 30 seconds per account.
CREATE OR REPLACE FUNCTION public.enforce_comment_rate_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE recent INT;
BEGIN
  SELECT count(*) INTO recent
  FROM public.stream_comments
  WHERE user_id = NEW.user_id AND created_at > now() - INTERVAL '30 seconds';

  IF recent >= 6 THEN
    RAISE EXCEPTION 'Slow down — you can post up to 6 comments every 30 seconds.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_stream_comments_rate ON public.stream_comments;
CREATE TRIGGER trg_stream_comments_rate
BEFORE INSERT ON public.stream_comments FOR EACH ROW EXECUTE FUNCTION public.enforce_comment_rate_limit();

REVOKE EXECUTE ON FUNCTION public.enforce_comment_rate_limit() FROM PUBLIC, anon, authenticated;

-- ------------------------------------------------------------- viewer counts
CREATE OR REPLACE FUNCTION public.report_stream_viewers(_stream_id UUID, _count INT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.live_streams
  SET viewer_count = GREATEST(0, _count),
      peak_viewers = GREATEST(peak_viewers, GREATEST(0, _count)),
      last_heartbeat_at = now()
  WHERE id = _stream_id;
END; $$;

GRANT EXECUTE ON FUNCTION public.report_stream_viewers(UUID, INT) TO authenticated;

-- ------------------------------------------------------------------ audit log
CREATE TABLE IF NOT EXISTS public.audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_label TEXT,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_recent_idx ON public.audit_log (created_at DESC);

GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.audit_log_id_seq TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_log_select_staff" ON public.audit_log;
CREATE POLICY "audit_log_select_staff" ON public.audit_log
  FOR SELECT TO authenticated USING (public.is_staff());
DROP POLICY IF EXISTS "audit_log_insert_auth" ON public.audit_log;
CREATE POLICY "audit_log_insert_auth" ON public.audit_log
  FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid());

-- ---------------------------------------------------------------- notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  kind TEXT NOT NULL DEFAULT 'info' CHECK (kind IN ('info','success','warning','critical')),
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_inbox_idx ON public.notifications (user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "notifications_insert_staff" ON public.notifications;
CREATE POLICY "notifications_insert_staff" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (public.is_staff());

-- ------------------------------------------------- realtime publication wiring
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.live_streams;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.stream_comments;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcast_state;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.live_streams REPLICA IDENTITY FULL;
ALTER TABLE public.stream_comments REPLICA IDENTITY FULL;
ALTER TABLE public.broadcast_state REPLICA IDENTITY FULL;
