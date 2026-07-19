-- Unique usernames mapped to auth users (mirrors remote migration profiles_username)
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_username_format CHECK (
    username ~ '^[a-z][a-z0-9_]{2,19}$'
  ),
  CONSTRAINT profiles_username_no_double_underscore CHECK (
    username !~ '__'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx
  ON public.profiles (lower(username));

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.lookup_email_by_username(p_username text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email text;
  v_normalized text;
BEGIN
  v_normalized := lower(trim(p_username));
  IF v_normalized IS NULL OR v_normalized = '' THEN
    RETURN NULL;
  END IF;

  SELECT u.email INTO v_email
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE lower(p.username) = v_normalized
  LIMIT 1;

  RETURN v_email;
END;
$$;

REVOKE ALL ON FUNCTION public.lookup_email_by_username(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_email_by_username(text) TO service_role;

CREATE OR REPLACE FUNCTION public.is_username_available(p_username text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_normalized text;
  v_exists boolean;
BEGIN
  v_normalized := lower(trim(p_username));
  IF v_normalized IS NULL OR v_normalized = '' THEN
    RETURN false;
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.profiles WHERE lower(username) = v_normalized
  ) INTO v_exists;

  RETURN NOT v_exists;
END;
$$;

REVOKE ALL ON FUNCTION public.is_username_available(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_username_available(text) TO authenticated, service_role;
