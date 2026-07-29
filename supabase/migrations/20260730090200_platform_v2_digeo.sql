-- ============================================================================
-- DIGITs Nigeria Election Watch — Platform v2 (DIGEO training & field forms)
-- Enrollment applications, deployment assignments, observation checklists,
-- field incident reports, module curriculum seed and certification records.
-- ============================================================================

-- ------------------------------------------------------------ curriculum shape
ALTER TABLE public.digeo_training_modules
  ADD COLUMN IF NOT EXISTS pass_mark INT NOT NULL DEFAULT 70,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS key_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.digeo_trainee_progress
  ADD COLUMN IF NOT EXISTS attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.digeo_certificates
  ADD COLUMN IF NOT EXISTS lga TEXT,
  ADD COLUMN IF NOT EXISTS average_score INT,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revoked_reason TEXT;

-- Coordinators need visibility of the whole cohort, not just their own rows.
DROP POLICY IF EXISTS "trainee_progress_select_own" ON public.digeo_trainee_progress;
CREATE POLICY "trainee_progress_select_own" ON public.digeo_trainee_progress
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff());

GRANT INSERT, UPDATE ON public.digeo_certificates TO authenticated;
DROP POLICY IF EXISTS "certificates_insert_own" ON public.digeo_certificates;
CREATE POLICY "certificates_insert_own" ON public.digeo_certificates
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.is_staff());
DROP POLICY IF EXISTS "certificates_update_staff" ON public.digeo_certificates;
CREATE POLICY "certificates_update_staff" ON public.digeo_certificates
  FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

-- ------------------------------------------------------- DIGEO application form
CREATE TABLE IF NOT EXISTS public.digeo_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Identity
  full_name TEXT NOT NULL,
  nin TEXT NOT NULL CHECK (nin ~ '^[0-9]{11}$'),
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('female','male','prefer_not_to_say')),
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  -- Where they will observe
  state TEXT NOT NULL,
  lga TEXT NOT NULL,
  ward TEXT,
  preferred_polling_unit TEXT,
  residential_address TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  -- Eligibility
  highest_education TEXT NOT NULL,
  occupation TEXT,
  languages TEXT[] NOT NULL DEFAULT ARRAY['English'],
  has_smartphone BOOLEAN NOT NULL DEFAULT true,
  has_prior_observation BOOLEAN NOT NULL DEFAULT false,
  prior_observation_detail TEXT,
  is_party_affiliated BOOLEAN NOT NULL DEFAULT false,
  party_affiliation_detail TEXT,
  availability TEXT NOT NULL CHECK (availability IN ('full_day','morning','afternoon','collation_only')),
  emergency_contact_name TEXT NOT NULL,
  emergency_contact_phone TEXT NOT NULL,
  motivation TEXT,
  -- Declarations
  accepted_code_of_conduct BOOLEAN NOT NULL DEFAULT false,
  accepted_data_policy BOOLEAN NOT NULL DEFAULT false,
  declared_non_partisan BOOLEAN NOT NULL DEFAULT false,
  signature_name TEXT NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Workflow
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('draft','submitted','under_review','approved','rejected','withdrawn')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT digeo_applications_declarations CHECK (
    status = 'draft'
    OR (accepted_code_of_conduct AND accepted_data_policy AND declared_non_partisan)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS digeo_applications_active_per_user
  ON public.digeo_applications (user_id)
  WHERE status IN ('draft','submitted','under_review','approved');

GRANT SELECT, INSERT, UPDATE ON public.digeo_applications TO authenticated;
GRANT ALL ON public.digeo_applications TO service_role;
ALTER TABLE public.digeo_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "digeo_applications_select" ON public.digeo_applications;
CREATE POLICY "digeo_applications_select" ON public.digeo_applications
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff());
DROP POLICY IF EXISTS "digeo_applications_insert" ON public.digeo_applications;
CREATE POLICY "digeo_applications_insert" ON public.digeo_applications
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "digeo_applications_update_own" ON public.digeo_applications;
CREATE POLICY "digeo_applications_update_own" ON public.digeo_applications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status IN ('draft','submitted'))
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "digeo_applications_review" ON public.digeo_applications;
CREATE POLICY "digeo_applications_review" ON public.digeo_applications
  FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP TRIGGER IF EXISTS trg_digeo_applications_updated ON public.digeo_applications;
CREATE TRIGGER trg_digeo_applications_updated
BEFORE UPDATE ON public.digeo_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- -------------------------------------------------------- deployment assignment
CREATE TABLE IF NOT EXISTS public.digeo_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  observer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  election_name TEXT NOT NULL,
  election_date DATE NOT NULL,
  state TEXT NOT NULL,
  lga TEXT NOT NULL,
  ward TEXT,
  polling_unit_code TEXT,
  polling_unit_name TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  reporting_time TIME NOT NULL DEFAULT '07:00',
  supervisor_name TEXT,
  supervisor_phone TEXT,
  livekit_room TEXT,
  status TEXT NOT NULL DEFAULT 'assigned'
    CHECK (status IN ('assigned','accepted','declined','checked_in','completed','no_show')),
  checked_in_at TIMESTAMPTZ,
  checked_in_lat DOUBLE PRECISION,
  checked_in_lng DOUBLE PRECISION,
  notes TEXT,
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS digeo_deployments_observer_idx ON public.digeo_deployments (observer_id, election_date DESC);

GRANT SELECT, INSERT, UPDATE ON public.digeo_deployments TO authenticated;
GRANT ALL ON public.digeo_deployments TO service_role;
ALTER TABLE public.digeo_deployments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "digeo_deployments_select" ON public.digeo_deployments;
CREATE POLICY "digeo_deployments_select" ON public.digeo_deployments
  FOR SELECT TO authenticated USING (observer_id = auth.uid() OR public.is_staff());
DROP POLICY IF EXISTS "digeo_deployments_insert_staff" ON public.digeo_deployments;
CREATE POLICY "digeo_deployments_insert_staff" ON public.digeo_deployments
  FOR INSERT TO authenticated WITH CHECK (public.is_staff());
DROP POLICY IF EXISTS "digeo_deployments_update_own" ON public.digeo_deployments;
CREATE POLICY "digeo_deployments_update_own" ON public.digeo_deployments
  FOR UPDATE TO authenticated USING (observer_id = auth.uid()) WITH CHECK (observer_id = auth.uid());
DROP POLICY IF EXISTS "digeo_deployments_update_staff" ON public.digeo_deployments;
CREATE POLICY "digeo_deployments_update_staff" ON public.digeo_deployments
  FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP TRIGGER IF EXISTS trg_digeo_deployments_updated ON public.digeo_deployments;
CREATE TRIGGER trg_digeo_deployments_updated
BEFORE UPDATE ON public.digeo_deployments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------- polling unit observation form
CREATE TABLE IF NOT EXISTS public.observation_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  observer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deployment_id UUID REFERENCES public.digeo_deployments(id) ON DELETE SET NULL,
  phase TEXT NOT NULL CHECK (phase IN ('setup','accreditation','voting','counting','collation')),
  election_name TEXT NOT NULL,
  state TEXT NOT NULL,
  lga TEXT NOT NULL,
  ward TEXT,
  polling_unit_name TEXT NOT NULL,
  polling_unit_code TEXT,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  -- Setup / opening
  opened_on_time BOOLEAN,
  actual_open_time TIME,
  bvas_present BOOLEAN,
  bvas_zero_print_verified BOOLEAN,
  materials_complete BOOLEAN,
  inec_officials_count INT CHECK (inec_officials_count IS NULL OR inec_officials_count >= 0),
  security_present BOOLEAN,
  party_agents_count INT CHECK (party_agents_count IS NULL OR party_agents_count >= 0),
  -- Accessibility & conduct
  accessible_to_pwd BOOLEAN,
  secret_ballot_respected BOOLEAN,
  voter_queue_orderly BOOLEAN,
  -- Counting / results
  registered_voters INT CHECK (registered_voters IS NULL OR registered_voters >= 0),
  accredited_voters INT CHECK (accredited_voters IS NULL OR accredited_voters >= 0),
  valid_votes INT CHECK (valid_votes IS NULL OR valid_votes >= 0),
  rejected_votes INT CHECK (rejected_votes IS NULL OR rejected_votes >= 0),
  total_votes_cast INT CHECK (total_votes_cast IS NULL OR total_votes_cast >= 0),
  ec8a_signed_by_agents BOOLEAN,
  ec8a_photo_path TEXT,
  results_uploaded_to_irev BOOLEAN,
  results_posted_publicly BOOLEAN,
  -- Free text + integrity
  irregularities TEXT,
  observer_remarks TEXT,
  overall_rating TEXT CHECK (overall_rating IS NULL OR overall_rating IN ('excellent','good','fair','poor','critical')),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft','submitted','verified','flagged')),
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Accreditation can never exceed registration, and votes can never exceed
  -- accreditation: the two arithmetic checks that catch most result fraud.
  CONSTRAINT checklist_accredited_bound CHECK (
    registered_voters IS NULL OR accredited_voters IS NULL OR accredited_voters <= registered_voters
  ),
  CONSTRAINT checklist_votes_bound CHECK (
    accredited_voters IS NULL OR total_votes_cast IS NULL OR total_votes_cast <= accredited_voters
  )
);

CREATE INDEX IF NOT EXISTS observation_checklists_observer_idx
  ON public.observation_checklists (observer_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS observation_checklists_geo_idx ON public.observation_checklists (state, lga);

GRANT SELECT, INSERT, UPDATE ON public.observation_checklists TO authenticated;
GRANT ALL ON public.observation_checklists TO service_role;
ALTER TABLE public.observation_checklists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "checklists_select" ON public.observation_checklists;
CREATE POLICY "checklists_select" ON public.observation_checklists
  FOR SELECT TO authenticated USING (observer_id = auth.uid() OR public.is_staff());
DROP POLICY IF EXISTS "checklists_insert" ON public.observation_checklists;
CREATE POLICY "checklists_insert" ON public.observation_checklists
  FOR INSERT TO authenticated WITH CHECK (observer_id = auth.uid());
DROP POLICY IF EXISTS "checklists_update_own" ON public.observation_checklists;
CREATE POLICY "checklists_update_own" ON public.observation_checklists
  FOR UPDATE TO authenticated
  USING (observer_id = auth.uid() AND status IN ('draft','submitted'))
  WITH CHECK (observer_id = auth.uid());
DROP POLICY IF EXISTS "checklists_verify_staff" ON public.observation_checklists;
CREATE POLICY "checklists_verify_staff" ON public.observation_checklists
  FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP TRIGGER IF EXISTS trg_checklists_updated ON public.observation_checklists;
CREATE TRIGGER trg_checklists_updated
BEFORE UPDATE ON public.observation_checklists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- --------------------------------------------------- DIGEO field incident form
CREATE TABLE IF NOT EXISTS public.incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  observer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deployment_id UUID REFERENCES public.digeo_deployments(id) ON DELETE SET NULL,
  incident_type TEXT NOT NULL CHECK (incident_type IN (
    'late_opening','material_shortage','bvas_failure','vote_buying','ballot_snatching',
    'violence','intimidation','underage_voting','multiple_voting','result_alteration',
    'agent_misconduct','security_misconduct','pwd_access_denied','other'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  state TEXT NOT NULL,
  lga TEXT NOT NULL,
  ward TEXT,
  polling_unit_name TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  headline TEXT NOT NULL CHECK (char_length(btrim(headline)) BETWEEN 6 AND 160),
  narrative TEXT NOT NULL CHECK (char_length(btrim(narrative)) >= 20),
  people_affected INT CHECK (people_affected IS NULL OR people_affected >= 0),
  security_notified BOOLEAN NOT NULL DEFAULT false,
  inec_notified BOOLEAN NOT NULL DEFAULT false,
  evidence_report_id UUID REFERENCES public.iwitness_reports(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','triaged','escalated','resolved','dismissed')),
  triaged_by UUID REFERENCES auth.users(id),
  triaged_at TIMESTAMPTZ,
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS incident_reports_queue_idx ON public.incident_reports (status, severity, occurred_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.incident_reports TO authenticated;
GRANT ALL ON public.incident_reports TO service_role;
ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "incidents_select" ON public.incident_reports;
CREATE POLICY "incidents_select" ON public.incident_reports
  FOR SELECT TO authenticated USING (observer_id = auth.uid() OR public.is_staff());
DROP POLICY IF EXISTS "incidents_insert" ON public.incident_reports;
CREATE POLICY "incidents_insert" ON public.incident_reports
  FOR INSERT TO authenticated WITH CHECK (observer_id = auth.uid());
DROP POLICY IF EXISTS "incidents_update_staff" ON public.incident_reports;
CREATE POLICY "incidents_update_staff" ON public.incident_reports
  FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP TRIGGER IF EXISTS trg_incidents_updated ON public.incident_reports;
CREATE TRIGGER trg_incidents_updated
BEFORE UPDATE ON public.incident_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------- realtime wiring
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.incident_reports;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.digeo_trainee_progress;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.incident_reports REPLICA IDENTITY FULL;
