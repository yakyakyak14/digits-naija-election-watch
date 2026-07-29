-- ============================================================================
-- DIGITs Nigeria Election Watch — Platform v2 (i-Witness evidence pipeline)
-- Private media bucket, per-report media rows, 24h user-side expiry, and the
-- Command Center review/broadcast workflow.
-- ============================================================================

-- ------------------------------------------------------------ iwitness_reports
ALTER TABLE public.iwitness_reports
  ADD COLUMN IF NOT EXISTS ward TEXT,
  ADD COLUMN IF NOT EXISTS polling_unit TEXT,
  ADD COLUMN IF NOT EXISTS accuracy_meters DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS duration_seconds INT,
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_note TEXT,
  ADD COLUMN IF NOT EXISTS public_caption TEXT,
  ADD COLUMN IF NOT EXISTS broadcast_slot INT CHECK (broadcast_slot IS NULL OR broadcast_slot BETWEEN 1 AND 6),
  ADD COLUMN IF NOT EXISTS hidden_from_user_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS device_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_realtime_capture BOOLEAN NOT NULL DEFAULT true;

-- Reports are anchored to a signed-in account; media_url can be resolved lazily
-- from storage_path via a signed URL, so it must not be required.
ALTER TABLE public.iwitness_reports ALTER COLUMN media_url DROP NOT NULL;

CREATE INDEX IF NOT EXISTS iwitness_queue_idx ON public.iwitness_reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS iwitness_user_idx ON public.iwitness_reports (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS iwitness_broadcast_idx
  ON public.iwitness_reports (is_public_broadcast, created_at DESC) WHERE is_public_broadcast = true;

-- Evidence must never be world-readable: the public only sees what the Command
-- Center explicitly broadcasts.
DROP POLICY IF EXISTS "iwitness_select_public" ON public.iwitness_reports;
CREATE POLICY "iwitness_select_broadcast" ON public.iwitness_reports
  FOR SELECT TO anon USING (is_public_broadcast = true AND status IN ('verified','broadcasted'));

DROP POLICY IF EXISTS "iwitness_select_auth" ON public.iwitness_reports;
CREATE POLICY "iwitness_select_auth" ON public.iwitness_reports
  FOR SELECT TO authenticated
  USING (
    (is_public_broadcast = true AND status IN ('verified','broadcasted'))
    OR (user_id = auth.uid() AND hidden_from_user_at IS NULL)
    OR public.is_staff()
  );

DROP POLICY IF EXISTS "iwitness_insert_authenticated" ON public.iwitness_reports;
CREATE POLICY "iwitness_insert_authenticated" ON public.iwitness_reports
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "iwitness_update_admins" ON public.iwitness_reports;
CREATE POLICY "iwitness_update_staff" ON public.iwitness_reports
  FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

REVOKE ALL ON public.iwitness_reports FROM anon;
GRANT SELECT ON public.iwitness_reports TO anon;
GRANT SELECT, INSERT, UPDATE ON public.iwitness_reports TO authenticated;

-- -------------------------------------------------------------- iwitness_media
-- A single report can carry several clips/stills captured back to back.
CREATE TABLE IF NOT EXISTS public.iwitness_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.iwitness_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('video','image')),
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  byte_size BIGINT,
  duration_seconds INT CHECK (duration_seconds IS NULL OR duration_seconds <= 125),
  width INT,
  height INT,
  sha256_hash TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS iwitness_media_report_idx ON public.iwitness_media (report_id, sort_order);

GRANT SELECT, INSERT ON public.iwitness_media TO authenticated;
GRANT ALL ON public.iwitness_media TO service_role;
ALTER TABLE public.iwitness_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "iwitness_media_select" ON public.iwitness_media;
CREATE POLICY "iwitness_media_select" ON public.iwitness_media
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff());
DROP POLICY IF EXISTS "iwitness_media_insert" ON public.iwitness_media;
CREATE POLICY "iwitness_media_insert" ON public.iwitness_media
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ------------------------------------------------------------- 24h user expiry
-- Media disappears from the reporter's in-app history after 24h but is retained
-- in cloud storage for the Command Center.
CREATE OR REPLACE FUNCTION public.expire_iwitness_user_history()
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE affected INT;
BEGIN
  UPDATE public.iwitness_reports
  SET hidden_from_user_at = now()
  WHERE hidden_from_user_at IS NULL AND expires_from_user_at <= now();
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END; $$;

GRANT EXECUTE ON FUNCTION public.expire_iwitness_user_history() TO authenticated;

-- Reporter-facing history view: automatically drops rows past the 24h window.
CREATE OR REPLACE VIEW public.my_iwitness_history
WITH (security_invoker = true) AS
SELECT r.id, r.reporter_name, r.state, r.lga, r.ward, r.polling_unit, r.address,
       r.latitude, r.longitude, r.media_type, r.media_url, r.storage_path,
       r.description, r.status, r.triage_category, r.severity_score,
       r.duration_seconds, r.is_public_broadcast, r.created_at, r.expires_from_user_at
FROM public.iwitness_reports r
WHERE r.user_id = auth.uid()
  AND r.hidden_from_user_at IS NULL
  AND r.expires_from_user_at > now();

GRANT SELECT ON public.my_iwitness_history TO authenticated;

-- ------------------------------------------------------------- storage buckets
-- Evidence lives in a PRIVATE bucket; access is always via short-lived signed
-- URLs minted for the reporter or for Command Center staff.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'iwitness-media', 'iwitness-media', false, 78643200,
  ARRAY['video/webm','video/mp4','image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public = false,
      file_size_limit = 78643200,
      allowed_mime_types = ARRAY['video/webm','video/mp4','image/jpeg','image/png','image/webp'];

-- Retire the world-readable bucket created by the earlier migration.
UPDATE storage.buckets SET public = false WHERE id = 'iwitness-reports';

-- Public-facing avatars stay in their own public bucket.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 3145728, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Objects are namespaced by uploader: iwitness-media/<uid>/<report>/<file>
DROP POLICY IF EXISTS "iwitness_media_upload_own" ON storage.objects;
CREATE POLICY "iwitness_media_upload_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'iwitness-media' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "iwitness_media_read_own_or_staff" ON storage.objects;
CREATE POLICY "iwitness_media_read_own_or_staff" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'iwitness-media'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_staff())
  );

-- Nobody deletes evidence from the client — retention is a service-role job.
DROP POLICY IF EXISTS "avatars_upload_own" ON storage.objects;
CREATE POLICY "avatars_upload_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
CREATE POLICY "avatars_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatars_read_all" ON storage.objects;
CREATE POLICY "avatars_read_all" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'avatars');

-- --------------------------------------------------------- realtime for queue
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.iwitness_reports;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.iwitness_reports REPLICA IDENTITY FULL;
