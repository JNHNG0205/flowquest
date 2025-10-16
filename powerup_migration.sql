-- Powerup System Migration - Update existing tables to latest version

-- First, let's check what columns might be missing and add them
-- Add new columns to powerups table if they don't exist
DO $$ 
BEGIN
    -- Add type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'powerups' AND column_name = 'type') THEN
        ALTER TABLE powerups ADD COLUMN type VARCHAR(50);
    END IF;
    
    -- Add effect_value column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'powerups' AND column_name = 'effect_value') THEN
        ALTER TABLE powerups ADD COLUMN effect_value INTEGER DEFAULT NULL;
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'powerups' AND column_name = 'created_at') THEN
        ALTER TABLE powerups ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Add new columns to player_powerups table if they don't exist
DO $$ 
BEGIN
    -- Add obtained_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'player_powerups' AND column_name = 'obtained_at') THEN
        ALTER TABLE player_powerups ADD COLUMN obtained_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add used_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'player_powerups' AND column_name = 'used_at') THEN
        ALTER TABLE player_powerups ADD COLUMN used_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'player_powerups' AND column_name = 'created_at') THEN
        ALTER TABLE player_powerups ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Add constraints if they don't exist
DO $$ 
BEGIN
    -- Add type constraint to powerups if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                   WHERE constraint_name = 'powerups_type_check') THEN
        ALTER TABLE powerups ADD CONSTRAINT powerups_type_check 
        CHECK (type IN ('extra_time', 'skip_question', 'double_points', 'hint', 'shield'));
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_player_powerups_room_player ON player_powerups(room_player_id);
CREATE INDEX IF NOT EXISTS idx_player_powerups_used ON player_powerups(is_used);
CREATE INDEX IF NOT EXISTS idx_powerups_type ON powerups(type);

-- Update existing powerups with type and effect_value if they're NULL
UPDATE powerups SET 
    type = CASE 
        WHEN name ILIKE '%time%' THEN 'extra_time'
        WHEN name ILIKE '%skip%' THEN 'skip_question'
        WHEN name ILIKE '%double%' OR name ILIKE '%point%' THEN 'double_points'
        WHEN name ILIKE '%hint%' THEN 'hint'
        WHEN name ILIKE '%shield%' THEN 'shield'
        ELSE 'extra_time' -- default fallback
    END,
    effect_value = CASE 
        WHEN name ILIKE '%time%' THEN 10
        WHEN name ILIKE '%double%' OR name ILIKE '%point%' THEN 2
        ELSE NULL
    END
WHERE type IS NULL;

-- Insert default powerups if they don't exist
INSERT INTO powerups (name, description, type, effect_value) 
SELECT * FROM (VALUES
    ('Extra Time', 'Gives you 10 extra seconds on your next question', 'extra_time', 10),
    ('Skip Question', 'Allows you to skip your next question without penalty', 'skip_question', NULL),
    ('Double Points', 'Your next correct answer will give you double points', 'double_points', 2),
    ('Hint', 'Reveals a hint for your next question', 'hint', NULL),
    ('Shield', 'Your next wrong answer won''t count against you', 'shield', NULL)
) AS new_powerups(name, description, type, effect_value)
WHERE NOT EXISTS (
    SELECT 1 FROM powerups WHERE powerups.name = new_powerups.name
);

-- Enable RLS if not already enabled
ALTER TABLE powerups ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_powerups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Anyone can read powerups" ON powerups;
DROP POLICY IF EXISTS "Users can view their own powerups" ON player_powerups;
DROP POLICY IF EXISTS "Users can insert their own powerups" ON player_powerups;
DROP POLICY IF EXISTS "Users can update their own powerups" ON player_powerups;

-- Create updated policies
CREATE POLICY "Anyone can read powerups" ON powerups
  FOR SELECT USING (true);

CREATE POLICY "Users can view their own powerups" ON player_powerups
  FOR SELECT USING (
    room_player_id IN (
      SELECT room_player_id FROM room_players 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own powerups" ON player_powerups
  FOR INSERT WITH CHECK (
    room_player_id IN (
      SELECT room_player_id FROM room_players 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own powerups" ON player_powerups
  FOR UPDATE USING (
    room_player_id IN (
      SELECT room_player_id FROM room_players 
      WHERE user_id = auth.uid()
    )
  );
