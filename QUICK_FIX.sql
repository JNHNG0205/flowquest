-- QUICK FIX: Add missing columns to rooms table
-- Run this NOW in your Supabase SQL Editor to fix the 500 error

-- Add current_turn column
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS current_turn INTEGER DEFAULT 0;

-- Add current_player_index column
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS current_player_index INTEGER DEFAULT 0;

-- Add status column with check constraint
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'waiting' 
CHECK (status IN ('waiting', 'in_progress', 'completed'));

-- Verify the columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'rooms' 
AND column_name IN ('current_turn', 'current_player_index', 'status');
