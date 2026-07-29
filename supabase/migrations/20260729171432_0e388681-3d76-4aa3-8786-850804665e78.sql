
-- ============ ENUM ============
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM (
    'super_admin','admin','control_center_operator','observer_coordinator','digeo','reviewer','viewer'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  phone TEXT,
  state TEXT,
  lga TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role security definer
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "user_roles_select_own" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "user_roles_select_admins" ON public.user_roles
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin')
  );
CREATE POLICY "user_roles_insert_admins" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin')
  );
CREATE POLICY "user_roles_delete_admins" ON public.user_roles
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin')
  );

-- ============ updated_at trigger ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated
BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ signup trigger ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'viewer')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ Bootstrap Super Admin ============
INSERT INTO public.profiles (id, display_name)
SELECT '3bd31686-f95b-4a81-b690-ed7571be0d6e'::uuid, 'Super Admin'
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = '3bd31686-f95b-4a81-b690-ed7571be0d6e')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT '3bd31686-f95b-4a81-b690-ed7571be0d6e'::uuid, 'super_admin'
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = '3bd31686-f95b-4a81-b690-ed7571be0d6e')
ON CONFLICT (user_id, role) DO NOTHING;
