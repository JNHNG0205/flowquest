-- Powerup System Setup for FlowQuest

-- Create powerups table
CREATE TABLE IF NOT EXISTS powerups (
  powerup_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('extra_time', 'skip_question', 'double_points', 'hint', 'shield')),
  effect_value INTEGER DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create player_powerups table
CREATE TABLE IF NOT EXISTS player_powerups (
  player_powerup_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_player_id UUID NOT NULL REFERENCES room_players(room_player_id) ON DELETE CASCADE,
  powerup_id UUID NOT NULL REFERENCES powerups(powerup_id) ON DELETE CASCADE,
  is_used BOOLEAN DEFAULT FALSE,
  obtained_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_player_powerups_room_player ON player_powerups(room_player_id);
CREATE INDEX IF NOT EXISTS idx_player_powerups_used ON player_powerups(is_used);
CREATE INDEX IF NOT EXISTS idx_powerups_type ON powerups(type);

-- Insert default powerups
INSERT INTO powerups (name, description, type, effect_value) VALUES
('Extra Time', 'Gives you 10 extra seconds on your next question', 'extra_time', 10),
('Skip Question', 'Skip your next question and automatically get full points for the correct answer', 'skip_question', NULL),
('Double Points', 'Your next correct answer will give you double points', 'double_points', 2),
('Hint', 'Reveals a hint for your next question', 'hint', NULL),
('Shield', 'Your next wrong answer won\'t count against you', 'shield', NULL)
ON CONFLICT DO NOTHING;

-- Add RLS policies for security
ALTER TABLE powerups ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_powerups ENABLE ROW LEVEL SECURITY;

-- Policy for powerups (everyone can read)
CREATE POLICY "Anyone can read powerups" ON powerups
  FOR SELECT USING (true);

-- Policy for player_powerups (users can only see their own)
CREATE POLICY "Users can view their own powerups" ON player_powerups
  FOR SELECT USING (
    room_player_id IN (
      SELECT room_player_id FROM room_players 
      WHERE user_id = auth.uid()
    )
  );

-- Policy for inserting player_powerups (only through API)
CREATE POLICY "Users can insert their own powerups" ON player_powerups
  FOR INSERT WITH CHECK (
    room_player_id IN (
      SELECT room_player_id FROM room_players 
      WHERE user_id = auth.uid()
    )
  );

-- Policy for updating player_powerups (only to mark as used)
CREATE POLICY "Users can update their own powerups" ON player_powerups
  FOR UPDATE USING (
    room_player_id IN (
      SELECT room_player_id FROM room_players 
      WHERE user_id = auth.uid()
    )
  );
