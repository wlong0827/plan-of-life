-- Create user_norms table for customizable norms
CREATE TABLE public.user_norms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  norm_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_norms ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own norms"
ON public.user_norms
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own norms"
ON public.user_norms
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own norms"
ON public.user_norms
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own norms"
ON public.user_norms
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_user_norms_user_id ON public.user_norms(user_id);

-- Insert default norms for existing users
INSERT INTO public.user_norms (user_id, norm_name, is_default, is_active)
SELECT DISTINCT user_id, 'Morning Offering', true, true FROM public.daily_completions
UNION
SELECT DISTINCT user_id, 'Morning Prayer', true, true FROM public.daily_completions
UNION
SELECT DISTINCT user_id, 'Holy Mass', true, true FROM public.daily_completions
UNION
SELECT DISTINCT user_id, 'Angelus', true, true FROM public.daily_completions
UNION
SELECT DISTINCT user_id, 'Visit To The Blessed Sacrament', true, true FROM public.daily_completions
UNION
SELECT DISTINCT user_id, 'Holy Rosary', true, true FROM public.daily_completions
UNION
SELECT DISTINCT user_id, 'Spiritual Reading', true, true FROM public.daily_completions
UNION
SELECT DISTINCT user_id, 'Examination Of Conscience', true, true FROM public.daily_completions
UNION
SELECT DISTINCT user_id, 'Three Purity Hail Maries', true, true FROM public.daily_completions;