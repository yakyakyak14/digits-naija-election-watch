-- ============================================================================
-- Grant DIGEO to wyntech.ng@gmail.com.
--
-- Commit ef8310d ("grant DIGEO status to wyntech.ng@gmail.com &
-- wynmanagement.ng@gmail.com") intended this, but the row was never written:
-- the account still held `viewer` only, so livekit-token refused the broadcast
-- with 403 "Only certified DIGEO observers and Control Center operators can
-- broadcast."
--
-- Idempotent, and mirrors 20260730120000 for the other account.
-- ============================================================================

DO $$
DECLARE
  target_id UUID;
  target_name TEXT;
  target_state TEXT;
  actor_id UUID;
  cert_number TEXT;
BEGIN
  SELECT u.id, COALESCE(p.display_name, split_part(u.email, '@', 1)), p.state
    INTO target_id, target_name, target_state
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE lower(u.email) = 'wyntech.ng@gmail.com';

  IF target_id IS NULL THEN
    RAISE NOTICE 'wyntech.ng@gmail.com not found — nothing to do.';
    RETURN;
  END IF;

  SELECT user_id INTO actor_id FROM public.user_roles WHERE role = 'super_admin' LIMIT 1;

  INSERT INTO public.user_roles (user_id, role, granted_by)
  VALUES (target_id, 'digeo', actor_id)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- A certificate needs a locality; default to the FCT and let the Command
  -- Center correct it rather than inventing something more specific.
  target_state := COALESCE(NULLIF(target_state, ''), 'Federal Capital Territory');
  UPDATE public.profiles
     SET state = target_state,
         display_name = COALESCE(NULLIF(display_name, ''), target_name)
   WHERE id = target_id;

  INSERT INTO public.digeo_trainee_progress (user_id, module_id, status, quiz_score, attempts, completed_at)
  SELECT target_id, m.id, 'completed', 100, 1, now()
  FROM public.digeo_training_modules m
  WHERE m.is_published
  ON CONFLICT (user_id, module_id) DO UPDATE
    SET status = 'completed',
        quiz_score = GREATEST(public.digeo_trainee_progress.quiz_score, 100),
        completed_at = COALESCE(public.digeo_trainee_progress.completed_at, now());

  cert_number := 'DIGEO-' || to_char(now(), 'YYYY') || '-' ||
                 lpad((10000 + (abs(hashtext(target_id::text)) % 89999))::text, 5, '0');

  INSERT INTO public.digeo_certificates
    (user_id, certificate_number, full_name, state, average_score, qr_code_hash, expires_at)
  VALUES
    (target_id, cert_number, target_name, target_state, 100,
     substr(encode(digest(target_id::text || cert_number, 'sha256'), 'hex'), 1, 32),
     now() + INTERVAL '730 days')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.notifications (user_id, title, body, kind, link)
  VALUES (
    target_id,
    'You are accredited as a DIGEO observer',
    'Your DIGEO accreditation is active. You can now broadcast live from your ' ||
    'assigned polling unit — an operator approves each feed before it reaches ' ||
    'the public grid.',
    'success',
    '/control-center/training'
  );

  INSERT INTO public.audit_log (actor_id, actor_label, action, entity, entity_id, detail)
  VALUES (
    actor_id,
    'migration 20260802090000',
    'digeo.accredit',
    'user_roles',
    target_id::text,
    jsonb_build_object(
      'email', 'wyntech.ng@gmail.com',
      'certificate', cert_number,
      'note', 'completes the grant intended by commit ef8310d'
    )
  );

  RAISE NOTICE 'Accredited % as DIGEO with certificate %', target_name, cert_number;
END $$;
