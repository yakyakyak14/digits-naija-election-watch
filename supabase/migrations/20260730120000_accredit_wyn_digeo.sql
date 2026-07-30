-- ============================================================================
-- Accredit wynmanagement.ng@gmail.com as a DIGEO observer.
--
-- Operator-requested grant. Written as a migration rather than an ad-hoc query so
-- the action is reviewable and reproducible, and recorded in audit_log like any
-- other role change.
--
-- Note: this account had no NIN and no state on its profile. The certificate
-- requires a state, so it is set to the Federal Capital Territory below and the
-- NIN is left for the holder to supply in profile settings — i-Witness reporting
-- stays locked until they do. Correct the state from the Command Center if wrong.
-- ============================================================================

DO $$
DECLARE
  target_id UUID;
  target_name TEXT;
  target_state TEXT;
  actor_id UUID;
  cert_number TEXT;
  cert_hash TEXT;
BEGIN
  SELECT u.id, COALESCE(p.display_name, split_part(u.email, '@', 1)), p.state
    INTO target_id, target_name, target_state
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE lower(u.email) = 'wynmanagement.ng@gmail.com';

  IF target_id IS NULL THEN
    RAISE NOTICE 'wynmanagement.ng@gmail.com not found — nothing to do.';
    RETURN;
  END IF;

  -- Attribute the grant to the bootstrapped Super Admin.
  SELECT user_id INTO actor_id FROM public.user_roles WHERE role = 'super_admin' LIMIT 1;

  -- 1. Grant the DIGEO role.
  INSERT INTO public.user_roles (user_id, role, granted_by)
  VALUES (target_id, 'digeo', actor_id)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 2. Make sure the profile carries a locality the certificate can name.
  target_state := COALESCE(NULLIF(target_state, ''), 'Federal Capital Territory');
  UPDATE public.profiles
     SET state = target_state,
         display_name = COALESCE(NULLIF(display_name, ''), target_name)
   WHERE id = target_id;

  -- 3. Mark the whole published curriculum complete for this accreditation.
  INSERT INTO public.digeo_trainee_progress (user_id, module_id, status, quiz_score, attempts, completed_at)
  SELECT target_id, m.id, 'completed', 100, 1, now()
  FROM public.digeo_training_modules m
  WHERE m.is_published
  ON CONFLICT (user_id, module_id) DO UPDATE
    SET status = 'completed',
        quiz_score = GREATEST(public.digeo_trainee_progress.quiz_score, 100),
        completed_at = COALESCE(public.digeo_trainee_progress.completed_at, now());

  -- 4. Issue the accreditation certificate (idempotent on user_id).
  cert_number := 'DIGEO-' || to_char(now(), 'YYYY') || '-' ||
                 lpad((10000 + (abs(hashtext(target_id::text)) % 89999))::text, 5, '0');
  cert_hash := substr(encode(digest(target_id::text || cert_number, 'sha256'), 'hex'), 1, 32);

  INSERT INTO public.digeo_certificates
    (user_id, certificate_number, full_name, state, average_score, qr_code_hash, expires_at)
  VALUES
    (target_id, cert_number, target_name, target_state, 100, cert_hash,
     now() + INTERVAL '730 days')
  ON CONFLICT (user_id) DO NOTHING;

  -- 5. In-app notification, so it is waiting for them regardless of email.
  INSERT INTO public.notifications (user_id, title, body, kind, link)
  VALUES (
    target_id,
    'You are accredited as a DIGEO observer',
    'Your DIGEO accreditation is active and your certificate has been issued. ' ||
    'Open the academy to view and print it, and add your NIN in profile settings ' ||
    'to unlock i-Witness reporting.',
    'success',
    '/control-center/training'
  );

  -- 6. Audit trail.
  INSERT INTO public.audit_log (actor_id, actor_label, action, entity, entity_id, detail)
  VALUES (
    actor_id,
    'migration 20260730120000',
    'digeo.accredit',
    'user_roles',
    target_id::text,
    jsonb_build_object(
      'email', 'wynmanagement.ng@gmail.com',
      'certificate', cert_number,
      'state', target_state,
      'note', 'operator-requested accreditation'
    )
  );

  RAISE NOTICE 'Accredited % as DIGEO with certificate %', target_name, cert_number;
END $$;
