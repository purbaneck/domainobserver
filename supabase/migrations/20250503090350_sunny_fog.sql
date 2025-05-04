-- Create domains table
CREATE TABLE IF NOT EXISTS public.domains (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  domain TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_checked TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  notify_if_available BOOLEAN NOT NULL DEFAULT TRUE
);

-- Create domain_checks table for historical checks
CREATE TABLE IF NOT EXISTS public.domain_checks (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  domain_id BIGINT NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  check_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  details JSONB
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domain_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for domains
CREATE POLICY "Users can view their own domains" ON public.domains
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own domains" ON public.domains
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own domains" ON public.domains
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own domains" ON public.domains
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for domain_checks
CREATE POLICY "Users can view checks for their domains" ON public.domain_checks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.domains
      WHERE domains.id = domain_checks.domain_id
      AND domains.user_id = auth.uid()
    )
  );

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create indexes
CREATE INDEX IF NOT EXISTS domains_user_id_idx ON public.domains (user_id);
CREATE INDEX IF NOT EXISTS domains_status_idx ON public.domains (status);
CREATE INDEX IF NOT EXISTS domain_checks_domain_id_idx ON public.domain_checks (domain_id);
