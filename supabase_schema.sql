-- FlowQuest Additional Setup for Existing Schema
-- Your existing tables: rooms, room_players, question, room_questions, question_attempts, powerups, player_powerups

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

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

-- Add index on room_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_rooms_room_code ON public.rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_rooms_is_active ON public.rooms(is_active);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_room_players_room_id ON public.room_players(room_id);
CREATE INDEX IF NOT EXISTS idx_room_players_user_id ON public.room_players(user_id);
CREATE INDEX IF NOT EXISTS idx_room_questions_room_id ON public.room_questions(room_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_room_question_id ON public.question_attempts(room_question_id);
CREATE INDEX IF NOT EXISTS idx_question_difficulty ON public.question(difficulty);

-- Enable Row Level Security (if not already enabled)
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.powerups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_powerups ENABLE ROW LEVEL SECURITY;

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game Sessions table
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_code TEXT UNIQUE NOT NULL,
  host_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed')),
  current_turn INTEGER NOT NULL DEFAULT 0,
  current_player_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);

-- Session Players table
CREATE TABLE IF NOT EXISTS public.session_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  player_number INTEGER NOT NULL,
  board_position INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'disconnected')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, user_id),
  UNIQUE(session_id, player_number)
);

-- Questions table
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  topic TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session Questions table
CREATE TABLE IF NOT EXISTS public.session_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  turn_number INTEGER NOT NULL,
  tile_position INTEGER NOT NULL,
  asked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, question_id)
);

-- Question Attempts table
CREATE TABLE IF NOT EXISTS public.question_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_question_id UUID NOT NULL REFERENCES public.session_questions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.session_players(id) ON DELETE CASCADE,
  answer_given TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_taken INTEGER NOT NULL,
  points_earned INTEGER NOT NULL DEFAULT 0,
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_question_id, player_id)
);

-- Power-ups table
CREATE TABLE IF NOT EXISTS public.powerups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('double_points', 'skip_question', 'freeze_player', 'swap_score', 'time_boost')),
  effect_value INTEGER,
  icon TEXT
);

-- Player Power-ups table
CREATE TABLE IF NOT EXISTS public.player_powerups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES public.session_players(id) ON DELETE CASCADE,
  powerup_id UUID NOT NULL REFERENCES public.powerups(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_game_sessions_room_code ON public.game_sessions(room_code);
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON public.game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_session_players_session_id ON public.session_players(session_id);
CREATE INDEX IF NOT EXISTS idx_session_players_user_id ON public.session_players(user_id);
CREATE INDEX IF NOT EXISTS idx_session_questions_session_id ON public.session_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_session_question_id ON public.question_attempts(session_question_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON public.questions(topic);

-- Function to increment player score
CREATE OR REPLACE FUNCTION increment_player_score(p_player_id UUID, p_points INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.session_players
  SET score = score + p_points
  WHERE id = p_player_id;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.powerups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_powerups ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for game_sessions
CREATE POLICY "Anyone can view game sessions" ON public.game_sessions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create game sessions" ON public.game_sessions
  FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Host can update game sessions" ON public.game_sessions
  FOR UPDATE USING (auth.uid() = host_id);

-- RLS Policies for session_players
CREATE POLICY "Anyone can view session players" ON public.session_players
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can join sessions" ON public.session_players
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Players can update their own data" ON public.session_players
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for questions
CREATE POLICY "Anyone can view questions" ON public.questions
  FOR SELECT USING (true);

-- RLS Policies for session_questions
CREATE POLICY "Anyone can view session questions" ON public.session_questions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create session questions" ON public.session_questions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for question_attempts
CREATE POLICY "Anyone can view question attempts" ON public.question_attempts
  FOR SELECT USING (true);

CREATE POLICY "Players can create their own attempts" ON public.question_attempts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.session_players
      WHERE id = player_id AND user_id = auth.uid()
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
      SELECT 1 FROM public.session_players
      WHERE id = player_id AND user_id = auth.uid()
    )
  );

-- Insert sample questions
INSERT INTO public.questions (question_text, question_type, difficulty, options, correct_answer, explanation, topic) VALUES
('What is a for loop used for in Python?', 'multiple_choice', 'easy', '["Iterating over a sequence", "Declaring variables", "Defining functions", "Importing modules"]', 'Iterating over a sequence', 'For loops are used to iterate over sequences like lists, tuples, or strings.', 'Loops'),
('What does the "if" statement do?', 'multiple_choice', 'easy', '["Makes a decision", "Repeats code", "Defines a function", "Imports a library"]', 'Makes a decision', 'If statements allow you to execute code conditionally based on a boolean expression.', 'Conditionals'),
('Is Python a compiled language?', 'true_false', 'easy', '["True", "False"]', 'False', 'Python is an interpreted language, not compiled.', 'Basics'),
('What is the output of: print(5 > 3)', 'multiple_choice', 'easy', '["True", "False", "5", "3"]', 'True', '5 is greater than 3, so the comparison returns True.', 'Operators'),
('While loops continue until a condition is met.', 'true_false', 'easy', '["True", "False"]', 'True', 'While loops execute as long as the condition remains True.', 'Loops'),

('What does the "break" statement do in a loop?', 'multiple_choice', 'medium', '["Exits the loop", "Skips to next iteration", "Restarts the loop", "Pauses the loop"]', 'Exits the loop', 'The break statement terminates the loop immediately.', 'Loops'),
('What is recursion?', 'multiple_choice', 'medium', '["A function calling itself", "A loop structure", "A data type", "An operator"]', 'A function calling itself', 'Recursion is when a function calls itself to solve a problem.', 'Functions'),
('Can you have nested if statements in Python?', 'true_false', 'medium', '["True", "False"]', 'True', 'You can nest if statements inside other if statements.', 'Conditionals'),
('What is the difference between "==" and "="?', 'multiple_choice', 'medium', '["== compares, = assigns", "== assigns, = compares", "Both compare", "Both assign"]', '== compares, = assigns', '== is for comparison, = is for assignment.', 'Operators'),
('List comprehension is faster than traditional loops.', 'true_false', 'medium', '["True", "False"]', 'True', 'List comprehensions are generally faster and more Pythonic.', 'Advanced'),

('What is time complexity of binary search?', 'multiple_choice', 'hard', '["O(log n)", "O(n)", "O(n^2)", "O(1)"]', 'O(log n)', 'Binary search divides the search space in half each time.', 'Algorithms'),
('What is a decorator in Python?', 'multiple_choice', 'hard', '["A function that modifies another function", "A type of loop", "A data structure", "A conditional statement"]', 'A function that modifies another function', 'Decorators allow you to modify the behavior of functions.', 'Advanced'),
('Can Python have multiple inheritance?', 'true_false', 'hard', '["True", "False"]', 'True', 'Python supports multiple inheritance from multiple parent classes.', 'OOP'),
('What does "yield" do in Python?', 'multiple_choice', 'hard', '["Creates a generator", "Returns a value", "Raises an exception", "Imports a module"]', 'Creates a generator', 'Yield is used to create generator functions that can pause and resume.', 'Advanced'),
('Global Interpreter Lock (GIL) prevents true parallelism in Python.', 'true_false', 'hard', '["True", "False"]', 'True', 'The GIL prevents multiple threads from executing Python bytecode simultaneously.', 'Advanced');

-- Insert sample power-ups
INSERT INTO public.powerups (name, description, type, effect_value) VALUES
('Double Points', 'Earn double points on next correct answer', 'double_points', 2),
('Skip Question', 'Skip current question without penalty', 'skip_question', NULL),
('Freeze Player', 'Freeze another player for one turn', 'freeze_player', 1),
('Swap Score', 'Swap your score with another player', 'swap_score', NULL),
('Time Boost', 'Get 10 extra seconds for next question', 'time_boost', 10);
