-- FlowQuest Additional Setup for Existing Schema
-- Run this in your Supabase SQL Editor
-- Your existing tables: rooms, room_players, question, room_questions, question_attempts, powerups, player_powerups

-- Add missing columns to rooms table (for game state tracking)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='rooms' AND column_name='current_turn') 
  THEN
    ALTER TABLE public.rooms ADD COLUMN current_turn INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='rooms' AND column_name='current_player_index') 
  THEN
    ALTER TABLE public.rooms ADD COLUMN current_player_index INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='rooms' AND column_name='status') 
  THEN
    ALTER TABLE public.rooms ADD COLUMN status VARCHAR DEFAULT 'waiting' 
      CHECK (status IN ('waiting', 'in_progress', 'completed'));
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rooms_room_code ON public.rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_rooms_is_active ON public.rooms(is_active);
CREATE INDEX IF NOT EXISTS idx_room_players_room_id ON public.room_players(room_id);
CREATE INDEX IF NOT EXISTS idx_room_players_user_id ON public.room_players(user_id);
CREATE INDEX IF NOT EXISTS idx_room_questions_room_id ON public.room_questions(room_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_room_question_id ON public.question_attempts(room_question_id);
CREATE INDEX IF NOT EXISTS idx_question_difficulty ON public.question(difficulty);

-- Enable Row Level Security
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.powerups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_powerups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view rooms" ON public.rooms;
DROP POLICY IF EXISTS "Authenticated users can create rooms" ON public.rooms;
DROP POLICY IF EXISTS "Host can update rooms" ON public.rooms;
DROP POLICY IF EXISTS "Anyone can view room players" ON public.room_players;
DROP POLICY IF EXISTS "Authenticated users can join rooms" ON public.room_players;
DROP POLICY IF EXISTS "Players can update their own data" ON public.room_players;
DROP POLICY IF EXISTS "Anyone can view questions" ON public.question;
DROP POLICY IF EXISTS "Anyone can view room questions" ON public.room_questions;
DROP POLICY IF EXISTS "Authenticated users can create room questions" ON public.room_questions;
DROP POLICY IF EXISTS "Anyone can view question attempts" ON public.question_attempts;
DROP POLICY IF EXISTS "Players can create their own attempts" ON public.question_attempts;
DROP POLICY IF EXISTS "Anyone can view powerups" ON public.powerups;
DROP POLICY IF EXISTS "Anyone can view player powerups" ON public.player_powerups;
DROP POLICY IF EXISTS "Players can manage their own powerups" ON public.player_powerups;

-- RLS Policies for rooms
CREATE POLICY "Anyone can view rooms" ON public.rooms
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create rooms" ON public.rooms
  FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Host can update rooms" ON public.rooms
  FOR UPDATE USING (auth.uid() = host_id);

-- RLS Policies for room_players
CREATE POLICY "Anyone can view room players" ON public.room_players
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can join rooms" ON public.room_players
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Players can update their own data" ON public.room_players
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for questions
CREATE POLICY "Anyone can view questions" ON public.question
  FOR SELECT USING (true);

-- RLS Policies for room_questions
CREATE POLICY "Anyone can view room questions" ON public.room_questions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create room questions" ON public.room_questions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for question_attempts
CREATE POLICY "Anyone can view question attempts" ON public.question_attempts
  FOR SELECT USING (true);

CREATE POLICY "Players can create their own attempts" ON public.question_attempts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.room_players
      WHERE room_player_id = question_attempts.room_player_id 
        AND user_id = auth.uid()
    )
  );

-- RLS Policies for powerups
CREATE POLICY "Anyone can view powerups" ON public.powerups
  FOR SELECT USING (true);

-- RLS Policies for player_powerups
CREATE POLICY "Anyone can view player powerups" ON public.player_powerups
  FOR SELECT USING (true);

CREATE POLICY "Players can manage their own powerups" ON public.player_powerups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.room_players
      WHERE room_player_id = player_powerups.room_player_id 
        AND user_id = auth.uid()
    )
  );

-- Insert sample Python control flow questions
INSERT INTO public.question (question_text, options, correct_answer, difficulty) VALUES
('What is a for loop used for in Python?', '["Iterating over a sequence", "Declaring variables", "Defining functions", "Importing modules"]', 'Iterating over a sequence', 'easy'),
('What does the "if" statement do?', '["Makes a decision", "Repeats code", "Defines a function", "Imports a library"]', 'Makes a decision', 'easy'),
('What is the output of: print(5 > 3)', '["True", "False", "5", "3"]', 'True', 'easy'),
('Which keyword is used to exit a loop early?', '["break", "exit", "stop", "end"]', 'break', 'easy'),
('What does "else" do in an if-else statement?', '["Runs when condition is False", "Runs when condition is True", "Repeats code", "Exits the program"]', 'Runs when condition is False', 'easy'),

('What does the "break" statement do in a loop?', '["Exits the loop", "Skips to next iteration", "Restarts the loop", "Pauses the loop"]', 'Exits the loop', 'medium'),
('What is the difference between "while" and "for" loops?', '["while is condition-based, for iterates over sequences", "They are the same", "while is faster", "for cannot use break"]', 'while is condition-based, for iterates over sequences', 'medium'),
('What does "continue" do in a loop?', '["Skips to the next iteration", "Exits the loop", "Pauses execution", "Restarts the loop"]', 'Skips to the next iteration', 'medium'),
('Can you have nested if statements in Python?', '["True", "False"]', 'True', 'medium'),
('What is the purpose of "elif"?', '["Additional conditions after if", "Ends an if block", "Repeats code", "Defines a function"]', 'Additional conditions after if', 'medium'),

('What is recursion?', '["A function calling itself", "A loop structure", "A data type", "An operator"]', 'A function calling itself', 'hard'),
('What happens if a while loop condition never becomes False?', '["Infinite loop", "Syntax error", "Program ends", "Nothing executes"]', 'Infinite loop', 'hard'),
('What is list comprehension?', '["Concise way to create lists", "A loop type", "A function", "A conditional"]', 'Concise way to create lists', 'hard'),
('What does "pass" do in Python?', '["Does nothing, placeholder", "Exits the function", "Skips iteration", "Raises error"]', 'Does nothing, placeholder', 'hard'),
('What is the time complexity of a nested for loop?', '["O(n²)", "O(n)", "O(log n)", "O(1)"]', 'O(n²)', 'hard'),

('A for loop can iterate over strings.', '["True", "False"]', 'True', 'easy'),
('The range() function can only generate positive numbers.', '["False", "True"]', 'False', 'easy'),
('You can use "and" and "or" in if statements.', '["True", "False"]', 'True', 'easy'),
('Python uses indentation to define code blocks.', '["True", "False"]', 'True', 'easy'),
('A while loop must have a counter variable.', '["False", "True"]', 'False', 'easy')
ON CONFLICT DO NOTHING;

-- Insert sample power-ups
INSERT INTO public.powerups (name, description) VALUES
('Double Points', 'Earn double points on next correct answer'),
('Skip Question', 'Skip current question without penalty'),
('Freeze Player', 'Freeze another player for one turn'),
('Swap Score', 'Swap your score with another player'),
('Time Boost', 'Get 10 extra seconds for next question')
ON CONFLICT DO NOTHING;

-- Create helper function to get user details (optional, for easier joins)
CREATE OR REPLACE FUNCTION get_user_info(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  username TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email::TEXT,
    COALESCE(au.raw_user_meta_data->>'username', SPLIT_PART(au.email, '@', 1))::TEXT as username
  FROM auth.users au
  WHERE au.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'FlowQuest schema setup complete! 🎮';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Enable Realtime for tables: rooms, room_players, room_questions, question_attempts';
  RAISE NOTICE '2. Go to Database → Replication in Supabase dashboard';
  RAISE NOTICE '3. Test by creating a room in your app';
END $$;
