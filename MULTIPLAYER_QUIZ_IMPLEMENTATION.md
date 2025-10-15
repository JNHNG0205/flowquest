# Multiplayer Question Answering System - Implementation Summary

## Overview
Implemented a multiplayer quiz system where ALL players answer the same question simultaneously, with bonus points awarded for faster answers.

## Database Changes (MUST RUN FIRST!)

### SQL Migration: `multiplayer_answering.sql`
Run this in your Supabase SQL Editor before testing:

```sql
-- Add columns to room_questions table
ALTER TABLE public.room_questions 
ADD COLUMN IF NOT EXISTS total_players INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS players_answered INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS all_answered BOOLEAN DEFAULT FALSE;

-- Add column to question_attempts to track answer order
ALTER TABLE public.question_attempts 
ADD COLUMN IF NOT EXISTS answer_order INTEGER DEFAULT 0;
```

## Game Flow

### 1. Question Trigger (Current Player Scans QR)
- Current player rolls dice → moves → scans tile QR
- **API: `/api/quiz/question`**
  - Fetches random question
  - Counts total active players in room
  - Creates `room_question` with:
    - `total_players`: Number of players who need to answer
    - `players_answered`: 0 (initially)
    - `all_answered`: false
  - Question broadcast to ALL players via Supabase Realtime

### 2. All Players Answer Simultaneously
- **UI: `game/[id]/page.tsx`**
  - QuizQuestion component shown to ALL players (not just current player)
  - Removed `disabled={!isMyTurn()}` restriction
  - All players see timer and can submit answers
  - Each player submits independently

### 3. Answer Submission & Scoring
- **API: `/api/quiz/submit`**
  - Tracks `answer_order` (1st, 2nd, 3rd, etc.)
  - Calculates points with bonuses:
    - **Base points**: Easy: 10, Medium: 15, Hard: 20
    - **Time bonus**: Up to +30% for faster answers
    - **Speed bonus** (new!):
      - 1st to answer: +20%
      - 2nd to answer: +10%
      - 3rd to answer: +5%
  - Increments `players_answered` counter
  - Checks if `players_answered >= total_players`
  - When all answered, sets `all_answered = true`
  - **Auto-advances turn** when last player submits

### 4. Waiting Screen
- Player who submits first sees:
  ```
  ⏳ (animated)
  Waiting for other players...
  You submitted your answer! Waiting for everyone else to finish.
  ```
- Shows their result (correct/incorrect, points earned)
- Cannot proceed until all players answer

### 5. Automatic Turn Advancement
- When `all_answered = true`:
  - Submit API automatically calls `/api/game/next-turn`
  - Turn advances to next player
  - Question clears for all players
  - Next player can roll dice

## Code Changes

### 1. Database Layer (`src/lib/database.ts`)
**Modified `submitAnswer()`:**
```typescript
// Track answer order
const { data: existingAttempts } = await supabase
  .from('question_attempts')
  .select('attempt_id')
  .eq('room_question_id', roomQuestionId);

const answerOrder = (existingAttempts?.length || 0) + 1;

// Speed bonus calculation
let speedBonus = 0;
if (answerOrder === 1) speedBonus = 0.20;      // 1st: +20%
else if (answerOrder === 2) speedBonus = 0.10; // 2nd: +10%
else if (answerOrder === 3) speedBonus = 0.05; // 3rd: +5%

pointsEarned = Math.round(basePoints * (1 + timeBonus + speedBonus));
```

### 2. Question API (`src/app/api/quiz/question/route.ts`)
**Added player counting:**
```typescript
// Get total number of active players
const { data: players } = await supabase
  .from('room_players')
  .select('room_player_id')
  .eq('room_id', sessionId);

const totalPlayers = players?.length || 0;

// Initialize tracking fields
await supabase
  .from('room_questions')
  .update({
    total_players: totalPlayers,
    players_answered: 0,
    all_answered: false,
  })
  .eq('room_question_id', roomQuestion.room_question_id);
```

### 3. Submit API (`src/app/api/quiz/submit/route.ts`)
**Added multiplayer tracking:**
```typescript
// Increment players_answered
const currentAnswered = roomQuestion.players_answered || 0;
const newAnsweredCount = currentAnswered + 1;
const allAnswered = newAnsweredCount >= totalPlayers;

await supabase
  .from('room_questions')
  .update({
    players_answered: newAnsweredCount,
    all_answered: allAnswered,
  })
  .eq('room_question_id', sessionQuestionId);

// Auto-advance turn when all answered
if (allAnswered) {
  await fetch('/api/game/next-turn', {
    method: 'POST',
    body: JSON.stringify({ sessionId: roomId }),
  });
}
```

### 4. Game Page (`src/app/game/[id]/page.tsx`)
**Added states:**
```typescript
const [hasAnswered, setHasAnswered] = useState(false);
const [waitingForOthers, setWaitingForOthers] = useState(false);
```

**Updated question display:**
```typescript
// Show to ALL players, not just current turn
{currentQuestion && !showResults && !hasAnswered && (
  <QuizQuestion
    question={currentQuestion}
    timeLimit={currentQuestion.time_limit}
    onSubmit={handleSubmitAnswer}
    disabled={false} // All players can answer!
  />
)}
```

**Added waiting screen:**
```typescript
{waitingForOthers && showResults && (
  <div className="bg-blue-50 rounded-lg shadow-lg p-8">
    <div className="text-6xl mb-4 animate-pulse">⏳</div>
    <h2>Waiting for other players...</h2>
    <p>You submitted your answer! Waiting for everyone else to finish.</p>
  </div>
)}
```

**Updated submit handler:**
```typescript
setHasAnswered(true);
if (!result.data.all_answered) {
  setWaitingForOthers(true);
}
// Removed manual advanceTurn() call - now automatic
```

## Testing Checklist

### Before Testing:
- [ ] Run `multiplayer_answering.sql` in Supabase SQL Editor
- [ ] Verify columns added: `total_players`, `players_answered`, `all_answered`, `answer_order`
- [ ] Enable Realtime for `room_questions` table (if not already)

### Test Scenario:
1. **Create a room** with 2-3 players
2. **Player 1 (current turn)**: 
   - Roll dice
   - Scan tile QR
   - Question appears
3. **All players**: 
   - See the same question simultaneously
   - Answer at different speeds
4. **Verify**:
   - First player gets +20% speed bonus
   - Second player gets +10% speed bonus
   - Players who answered see "Waiting for other players..."
   - Last player's submission triggers turn advancement
   - All players see turn advance to next player

### Expected Results:
- ✅ All players answer same question
- ✅ Faster answers get more points
- ✅ Speed bonus applied (check scores)
- ✅ Waiting screen shows for early finishers
- ✅ Turn advances only after ALL players answer
- ✅ No manual intervention needed

## Bonus Point Examples

### Example 1: Easy Question (10 base points)
- **Player A** (answered 1st, 5s): 10 * (1 + 0.3 time + 0.2 speed) = **15 points**
- **Player B** (answered 2nd, 8s): 10 * (1 + 0.2 time + 0.1 speed) = **13 points**
- **Player C** (answered 3rd, 12s): 10 * (1 + 0.0 time + 0.05 speed) = **11 points**

### Example 2: Hard Question (20 base points)
- **Player A** (answered 1st, 10s): 20 * (1 + 0.3 time + 0.2 speed) = **30 points**
- **Player B** (answered 2nd, 15s): 20 * (1 + 0.15 time + 0.1 speed) = **25 points**
- **Player C** (answered 3rd, 25s): 20 * (1 + 0.0 time + 0.05 speed) = **21 points**

## Troubleshooting

### Issue: Question only shows for current player
- **Check**: Game page should have `disabled={false}` not `disabled={!isMyTurn()}`
- **Fix**: Update QuizQuestion component props

### Issue: Turn advances immediately after first answer
- **Check**: Submit API should check `all_answered` before calling next-turn
- **Check**: `total_players` is set correctly in room_questions

### Issue: Speed bonus not applied
- **Check**: `answer_order` column exists in question_attempts
- **Check**: `submitAnswer()` function tracks answer order
- **Verify**: Check database to see answer_order values (1, 2, 3, etc.)

### Issue: Players can't see each other's questions
- **Check**: Supabase Realtime enabled for `room_questions` table
- **Check**: useQuizRealtime hook is subscribed correctly
- **Verify**: Console logs show "New question:" event

## Future Enhancements (Optional)

1. **Show live answer count**: Display "2/4 players answered" during question
2. **Leaderboard animation**: Show ranking after each question
3. **Power-ups**: Time freeze, double points, etc.
4. **Answer reveal**: Show who answered correctly after all submit
5. **Streaks**: Bonus points for consecutive correct answers

## Files Modified

- ✅ `multiplayer_answering.sql` - Database migration (NEW)
- ✅ `src/lib/database.ts` - Speed bonus logic
- ✅ `src/app/api/quiz/question/route.ts` - Player counting
- ✅ `src/app/api/quiz/submit/route.ts` - Multiplayer tracking & auto-advance
- ✅ `src/app/game/[id]/page.tsx` - UI for all players + waiting screen

---

**Status**: ✅ Implementation Complete
**Next Step**: Run SQL migration → Test with multiple players
