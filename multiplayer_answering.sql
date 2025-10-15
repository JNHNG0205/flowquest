-- Multiplayer Question Answering Feature
-- Add columns to track when all players are answering

-- Add columns to room_questions table
ALTER TABLE public.room_questions 
ADD COLUMN IF NOT EXISTS total_players INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS players_answered INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS all_answered BOOLEAN DEFAULT FALSE;

-- Add column to question_attempts to track answer order
ALTER TABLE public.question_attempts 
ADD COLUMN IF NOT EXISTS answer_order INTEGER DEFAULT 0;

-- Verify the columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'room_questions' 
AND column_name IN ('total_players', 'players_answered', 'all_answered');

SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'question_attempts' 
AND column_name = 'answer_order';
