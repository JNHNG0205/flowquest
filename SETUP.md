# FlowQuest - Setup Guide

## Overview
FlowQuest is a multiplayer educational hybrid board game that combines physical board tiles with digital quiz questions. Players scan QR codes on physical tiles to trigger Python control flow questions and collect power-ups.

## Prerequisites
- Node.js 18+ and pnpm
- Supabase account
- Mobile device with camera (for QR scanning)

## Step 1: Database Setup

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your Project URL and anon/public API key

2. **Run Database Migration**
   - Open your Supabase project dashboard
   - Go to SQL Editor
   - Copy and paste the contents of `supabase_schema.sql`
   - Run the SQL script
   - This will create all tables, functions, RLS policies, and sample data

3. **Enable Realtime**
   - Go to Database → Replication
   - Enable replication for these tables:
     - `game_sessions`
     - `session_players`
     - `session_questions`
     - `question_attempts`

## Step 2: Environment Setup

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace with your actual Supabase credentials.

## Step 3: Install Dependencies

```bash
pnpm install
```

## Step 4: Run Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

## Step 5: Authentication Setup

The app already has authentication configured. Users can:
- Sign up with email/password
- Sign in with Google OAuth (if configured in Supabase)

To enable Google OAuth:
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Add OAuth credentials from Google Cloud Console
4. Add callback URL: `http://localhost:3000/auth/callback`

## Project Structure

```
src/
├── app/
│   ├── api/                  # API routes
│   │   ├── rooms/           # Room management
│   │   ├── quiz/            # Quiz questions & answers
│   │   └── game/            # Game state & turns
│   ├── room/
│   │   ├── create/          # Create room page
│   │   └── join/            # Join room page
│   ├── game/[id]/           # Main game page
│   ├── login/               # Login page
│   └── page.tsx             # Home page
├── components/
│   ├── QRScanner.tsx        # QR code scanner
│   ├── QRCodeDisplay.tsx    # QR code generator
│   ├── Scoreboard.tsx       # Player scores
│   ├── QuizQuestion.tsx     # Quiz UI
│   └── DiceRoller.tsx       # Digital dice
├── hooks/
│   └── useGameRealtime.ts   # Realtime subscriptions
├── lib/
│   ├── database.ts          # Database helper functions
│   └── utils.ts             # Utility functions
├── types/
│   └── database.types.ts    # TypeScript types
└── utils/
    └── supabase/            # Supabase clients
```

## Game Flow

### 1. Creating a Room
1. User clicks "Create Room" on home page
2. System generates a 6-digit room code
3. QR code is displayed for easy sharing
4. Host waits for players to join
5. Host starts the game when ready (minimum 2 players)

### 2. Joining a Room
1. User clicks "Join Room"
2. Enter room code manually OR scan room QR code
3. User is added to the game session
4. Wait for host to start the game

### 3. Playing the Game
1. **Turn System**: Players take turns in order
2. **Roll Dice**: Current player rolls dice (physical or digital)
3. **Move**: Player moves forward on the board
4. **Scan Tile**: Player scans the QR code on the tile they landed on
5. **Answer Question**: A quiz question appears with countdown timer
6. **All Players Answer**: In Free-for-All mode, all players answer
7. **Scoring**: Points awarded based on correctness, speed, and difficulty
8. **Next Turn**: System advances to next player

### 4. Realtime Features
- All players see updates in real-time:
  - Score changes
  - Turn changes
  - New questions
  - Player movements

## Creating Physical Board Tiles

Each board tile needs a QR code. Generate QR codes with this format:

```json
{
  "type": "tile",
  "position": 1
}
```

Or simply the tile number: `1`, `2`, `3`, etc.

You can use the QRCodeDisplay component or online QR generators to create tile QR codes.

### Recommended Board Setup
- 20-30 tiles in a path/circuit
- Mix of question tiles and power-up tiles
- Clear tile numbers
- Durable material (laminated paper or plastic)

## Difficulty Settings

Questions have three difficulty levels:
- **Easy**: 20 seconds, 10 base points
- **Medium**: 35 seconds, 15 base points  
- **Hard**: 50 seconds, 20 base points

Time bonus: Up to 50% extra points for fast answers

## Power-Ups (Future Enhancement)

The database supports power-ups:
- **Double Points**: 2x points on next correct answer
- **Skip Question**: Skip without penalty
- **Freeze Player**: Freeze opponent for one turn
- **Swap Score**: Swap scores with another player
- **Time Boost**: +10 seconds on next question

To implement power-ups, add API routes and UI for collecting/using them.

## Customization

### Adding Questions
Add questions directly in Supabase:

```sql
INSERT INTO questions (question_text, question_type, difficulty, options, correct_answer, explanation, topic)
VALUES (
  'Your question here?',
  'multiple_choice',
  'medium',
  '["Option 1", "Option 2", "Option 3", "Option 4"]',
  'Option 1',
  'Explanation here',
  'Topic Name'
);
```

### Changing Scoring
Modify the `submitAnswer` function in `src/lib/database.ts`:

```typescript
const basePoints = {
  easy: 10,    // Change these values
  medium: 15,
  hard: 20,
};
```

### Adjusting Time Limits
Modify `getTimeLimit` function in `src/lib/database.ts`:

```typescript
return {
  easy: 20,    // seconds
  medium: 35,
  hard: 50,
}[difficulty];
```

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Update Supabase Redirect URLs

Add your production URL to Supabase:
- Go to Authentication → URL Configuration
- Add Site URL: `https://your-domain.com`
- Add Redirect URLs: `https://your-domain.com/auth/callback`

## Troubleshooting

### Camera Not Working
- Check browser permissions for camera access
- HTTPS is required for camera access (works on localhost or production with SSL)
- Try different browser

### Realtime Not Working
- Check Supabase replication is enabled
- Verify table permissions in RLS policies
- Check browser console for connection errors

### Questions Not Loading
- Verify questions exist in database
- Check RLS policies allow reading questions
- Ensure question format matches schema (options as JSON array)

### Players Can't Join
- Verify room code is correct
- Check game status is 'waiting' not 'in_progress'
- Ensure RLS policies allow inserts

## Testing Locally

1. Open two browser windows side-by-side
2. Sign in with different accounts (or use incognito for second user)
3. Create room in first window
4. Join room in second window
5. Start game and test gameplay

## Performance Tips

- Questions are cached to avoid re-fetching
- Realtime subscriptions auto-reconnect on network issues
- Database indexes optimize query performance
- Use pagination for large question sets (future enhancement)

## Security Notes

- Row Level Security (RLS) is enabled on all tables
- Users can only modify their own data
- API routes verify user authentication
- QR codes can be public (no sensitive data)

## Future Enhancements

- [ ] Power-up implementation
- [ ] Game history and statistics
- [ ] Leaderboards
- [ ] Custom question sets
- [ ] Team mode
- [ ] Voice chat integration
- [ ] Animated board visualization
- [ ] Achievement system
- [ ] Tournament mode

## Support

For issues or questions:
1. Check troubleshooting section
2. Review Supabase logs
3. Check browser console for errors
4. Verify environment variables

## License

MIT License - feel free to modify and use for educational purposes.
