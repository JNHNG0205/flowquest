// Database Types for FlowQuest (matching existing schema)

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface User {
  id: string;
  email?: string;
  username?: string;
}

export interface Room {
  room_id: string;
  room_code: string;
  host_id: string;
  created_at: string;
  is_active: boolean;
  current_turn?: number;
  current_player_index?: number;
  status?: string;
}

export interface RoomPlayer {
  room_player_id: string;
  room_id: string;
  user_id: string;
  score: number;
  position: number | null;
  // Relations
  user?: User;
}

export interface Question {
  question_id: string;
  question_text: string;
  options: string[]; // JSONB array
  correct_answer: string;
  difficulty: string | null;
  explanation?: string | null;
}

export interface RoomQuestion {
  room_question_id: string;
  room_id: string;
  question_id: string;
  round_number: number;
  time_limit: number | null;
  // Relations
  question?: Question;
}

export interface QuestionAttempt {
  attempt_id: string;
  room_question_id: string;
  room_player_id: string;
  is_correct: boolean | null;
  answer_time: number | null; // in seconds
  // Relations
  room_player?: RoomPlayer;
}

export type PowerUpType = 'extra_time' | 'skip_question' | 'double_points' | 'hint' | 'shield';

export interface PowerUp {
  powerup_id: string;
  name: string;
  description: string | null;
  type: PowerUpType;
  effect_value?: number; // For powerups that have numerical effects
}

export interface PlayerPowerUp {
  player_powerup_id: string;
  room_player_id: string;
  powerup_id: string;
  is_used: boolean;
  obtained_at: string;
  used_at?: string;
  // Relations
  powerup?: PowerUp;
}

// Legacy type aliases for compatibility
export type GameSession = Room;
export type SessionPlayer = RoomPlayer;
export type SessionQuestion = RoomQuestion;

// API Response Types
export interface CreateRoomResponse {
  session: GameSession;
  player: SessionPlayer;
}

export interface JoinRoomResponse {
  session: GameSession;
  player: SessionPlayer;
  players: SessionPlayer[];
}

export interface QuizQuestionResponse {
  session_question: SessionQuestion;
  question: Question;
  time_limit: number;
}

export interface SubmitAnswerResponse {
  attempt: QuestionAttempt;
  is_correct: boolean;
  points_earned: number;
  correct_answer: string;
  explanation: string | null;
}

export interface GameStateResponse {
  session: GameSession;
  players: SessionPlayer[];
  current_question?: SessionQuestion & { question: Question };
}

// Realtime Payload Types
export interface RealtimeScoreUpdate {
  player_id: string;
  score: number;
  board_position: number;
}

export interface RealtimeTurnUpdate {
  session_id: string;
  current_turn: number;
  current_player_index: number;
  current_player_id: string;
}

export interface RealtimeQuestionUpdate {
  session_question_id: string;
  question: Question;
  time_limit: number;
  asked_at: string;
}

export interface RealtimeAnswerUpdate {
  player_id: string;
  is_correct: boolean;
  time_taken: number;
  points_earned: number;
}

// Powerup API Response Types
export interface ScanPowerUpResponse {
  powerup: PowerUp;
  player_powerup: PlayerPowerUp;
  message: string;
}

export interface UsePowerUpResponse {
  success: boolean;
  message: string;
  effect_applied?: any;
}

export interface PlayerPowerUpsResponse {
  powerups: (PlayerPowerUp & { powerup: PowerUp })[];
  total_count: number;
}
