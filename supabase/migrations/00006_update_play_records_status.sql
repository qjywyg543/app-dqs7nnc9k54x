ALTER TABLE public.user_play_records
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS draw_time text;

ALTER TABLE public.user_play_records
ALTER COLUMN win_level DROP NOT NULL,
ALTER COLUMN win_name DROP NOT NULL;

-- Update existing records to set status based on win_level
UPDATE public.user_play_records
SET status = CASE
  WHEN win_level IS NULL THEN 'pending'
  WHEN win_level > 0 THEN 'won'
  ELSE 'lost'
END
WHERE status = 'pending';
