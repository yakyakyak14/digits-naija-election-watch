-- ============================================================================
-- Fix: user_roles RLS could never be satisfied by a signed-in admin.
--
-- Migration 20260729171455 revoked EXECUTE on has_role(uuid, app_role) from
-- `authenticated`, but the user_roles admin policies call exactly that
-- function. Postgres evaluates policy expressions with the privileges of the
-- querying role, so every admin SELECT/INSERT/DELETE on user_roles failed with
-- "permission denied for function has_role" — the Users & Roles screen could
-- only ever see the caller's own rows.
--
-- The replacement helpers (is_admin(), is_super_admin()) take no arguments and
-- read auth.uid() internally, so EXECUTE can be granted to `authenticated`
-- without letting anyone probe another account's roles.
--
-- This migration also closes a privilege-escalation hole: the old INSERT policy
-- let any `admin` grant `admin` or `super_admin` — including to themselves.
-- That restriction existed only in the React UI. It is now enforced in the
-- database, where it cannot be bypassed.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- ---------------------------------------------------------------- user_roles
DROP POLICY IF EXISTS "user_roles_select_admins" ON public.user_roles;
CREATE POLICY "user_roles_select_admins" ON public.user_roles
  FOR SELECT TO authenticated USING (public.is_staff());

DROP POLICY IF EXISTS "user_roles_insert_admins" ON public.user_roles;
CREATE POLICY "user_roles_insert_admins" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin()
    -- Admins may grant operational roles, never Admin or Super Admin.
    OR (public.is_admin() AND role NOT IN ('super_admin','admin'))
  );

DROP POLICY IF EXISTS "user_roles_delete_admins" ON public.user_roles;
CREATE POLICY "user_roles_delete_admins" ON public.user_roles
  FOR DELETE TO authenticated
  USING (
    public.is_super_admin()
    OR (public.is_admin() AND role NOT IN ('super_admin','admin'))
  );

-- The last Super Admin must not be able to lock everyone out of the platform.
CREATE OR REPLACE FUNCTION public.protect_last_super_admin()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.role = 'super_admin'
     AND (SELECT count(*) FROM public.user_roles WHERE role = 'super_admin') <= 1 THEN
    RAISE EXCEPTION 'Cannot revoke the last Super Admin — grant the role to another account first.'
      USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN OLD;
END; $$;

DROP TRIGGER IF EXISTS trg_protect_last_super_admin ON public.user_roles;
CREATE TRIGGER trg_protect_last_super_admin
BEFORE DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.protect_last_super_admin();

REVOKE EXECUTE ON FUNCTION public.protect_last_super_admin() FROM PUBLIC, anon, authenticated;

-- --------------------------------------------------- staff-visible user index
-- The Users & Roles screen needs real names and emails, which live in
-- auth.users. Expose only what staff legitimately administer.
CREATE OR REPLACE FUNCTION public.list_platform_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  display_name TEXT,
  state TEXT,
  lga TEXT,
  nin_verified BOOLEAN,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  roles public.app_role[]
)
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    u.id,
    u.email::text,
    COALESCE(p.display_name, split_part(u.email::text, '@', 1)),
    p.state,
    p.lga,
    COALESCE(p.nin_verified, false),
    u.created_at,
    u.last_sign_in_at,
    COALESCE(
      (SELECT array_agg(r.role ORDER BY r.role) FROM public.user_roles r WHERE r.user_id = u.id),
      ARRAY[]::public.app_role[]
    )
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE public.is_staff()
  ORDER BY u.created_at DESC
$$;

GRANT EXECUTE ON FUNCTION public.list_platform_users() TO authenticated;

-- ------------------------------------------------------- role grant/revoke API
-- Wrapping the writes keeps the audit trail honest: every grant is recorded
-- with the actor, and the same rules apply however the call is made.
CREATE OR REPLACE FUNCTION public.grant_user_role(_user_id UUID, _role public.app_role)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.is_super_admin() OR (public.is_admin() AND _role NOT IN ('super_admin','admin'))) THEN
    RAISE EXCEPTION 'You are not permitted to grant the % role.', _role USING ERRCODE = 'insufficient_privilege';
  END IF;

  INSERT INTO public.user_roles (user_id, role, granted_by)
  VALUES (_user_id, _role, auth.uid())
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.audit_log (actor_id, action, entity, entity_id, detail)
  VALUES (auth.uid(), 'role.grant', 'user_roles', _user_id::text, jsonb_build_object('role', _role));
END; $$;

CREATE OR REPLACE FUNCTION public.revoke_user_role(_user_id UUID, _role public.app_role)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.is_super_admin() OR (public.is_admin() AND _role NOT IN ('super_admin','admin'))) THEN
    RAISE EXCEPTION 'You are not permitted to revoke the % role.', _role USING ERRCODE = 'insufficient_privilege';
  END IF;

  DELETE FROM public.user_roles WHERE user_id = _user_id AND role = _role;

  INSERT INTO public.audit_log (actor_id, action, entity, entity_id, detail)
  VALUES (auth.uid(), 'role.revoke', 'user_roles', _user_id::text, jsonb_build_object('role', _role));
END; $$;

GRANT EXECUTE ON FUNCTION public.grant_user_role(UUID, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_user_role(UUID, public.app_role) TO authenticated;
