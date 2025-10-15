-- Create atomic increment function for players_answered
-- This prevents race conditions when multiple players submit answers simultaneously

CREATE OR REPLACE FUNCTION increment_players_answered(question_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE room_questions
  SET players_answered = players_answered + 1
  WHERE room_question_id = question_id
  RETURNING players_answered INTO new_count;
  
  RETURN new_count;
END;
$$ LANGUAGE plpgsql;

-- Test the function
-- SELECT increment_players_answered('your-room-question-id-here');
