-- Add display_order column to user_norms table
ALTER TABLE public.user_norms ADD COLUMN display_order integer;

-- Set initial display_order based on created_at for existing rows
UPDATE public.user_norms
SET display_order = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as row_num
  FROM public.user_norms
) AS subquery
WHERE public.user_norms.id = subquery.id;

-- Make display_order NOT NULL now that all rows have values
ALTER TABLE public.user_norms ALTER COLUMN display_order SET NOT NULL;