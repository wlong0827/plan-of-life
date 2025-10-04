-- Create table for daily spiritual norm completions
CREATE TABLE public.daily_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  norm_name TEXT NOT NULL,
  completed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, norm_name, completed_date)
);

-- Enable Row Level Security
ALTER TABLE public.daily_completions ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own completions"
ON public.daily_completions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own completions"
ON public.daily_completions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own completions"
ON public.daily_completions
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX idx_daily_completions_user_date ON public.daily_completions(user_id, completed_date);