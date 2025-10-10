# 🚀 FlowQuest Quick Start Guide

Welcome! Let's get your multiplayer educational board game up and running in **5 minutes**.

## ⚡ Quick Setup

### Step 1: Run SQL Setup (2 minutes)

1. Go to your **Supabase Dashboard** → SQL Editor
2. Open `supabase_setup.sql` from the project root
3. Copy all the SQL code
4. Paste into SQL Editor and click **RUN**
5. Wait for success message: "FlowQuest schema setup complete! 🎮"

This will:
- Add necessary columns to your existing tables
- Create indexes
- Set up security policies
- Insert 20 sample quiz questions
- Insert 5 power-ups

### Step 2: Enable Realtime (1 minute)

1. In Supabase Dashboard → **Database** → **Replication**
2. Enable replication for these tables:
   - ✅ `rooms`
   - ✅ `room_players`
   - ✅ `room_questions`
   - ✅ `question_attempts`

### Step 3: Environment Variables (30 seconds)

Create `.env.local` in project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these from: **Supabase Dashboard** → **Settings** → **API**

### Step 4: Run the App (30 seconds)

```bash
# Install dependencies (if not done)
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## 🎮 Test the Game (2 minutes)

### Test with 2 Browser Windows:

**Window 1 (Host):**
1. Sign in at `/login`
2. Click "Create Room"
3. Note the 6-digit room code
4. Keep this window open

**Window 2 (Player):**
1. Open incognito/private window
2. Sign in with different account
3. Click "Join Room"
4. Enter the room code from Window 1
5. Click "Join Room"

**Back to Window 1:**
1. You should see 2 players now
2. Click "Start Game"

**Play a Turn:**
1. Roll the digital dice
2. You'll be prompted to scan a tile
3. For testing, generate a test QR code:
   - Visit `/qr-generator.html` in your browser
   - Or just cancel the scanner and the question will load
4. Answer the quiz question
5. See your score update in real-time!
6. Both players can see updates instantly

## 📱 Create Physical Board (Optional)

### Generate Tile QR Codes:

1. Open `public/qr-generator.html` in browser:
   ```
   http://localhost:3000/qr-generator.html
   ```

2. Set number of tiles (default: 20)

3. Click "Generate QR Codes"

4. Options:
   - **Print Tiles** → Print directly
   - **Download All** → Save as PNG files

### Board Materials:
- Print QR codes on cardstock (recommended size: 2"x2")
- Laminate for durability
- Number each tile clearly
- Arrange in a path or circuit

### Game Pieces:
- Player tokens (different colors)
- 1 physical die (or use digital in app)

## ✅ Verify Everything Works

### Checklist:
- [ ] Can create a room
- [ ] Room code appears (6 digits)
- [ ] Can join room from another browser
- [ ] Both players appear in player list
- [ ] Host can start game
- [ ] Dice rolls work
- [ ] Questions appear
- [ ] Timer counts down
- [ ] Answers submit
- [ ] Scores update in real-time
- [ ] Both players see updates simultaneously

## 🐛 Common Issues

### Camera won't work for QR scanner?
- **Solution**: Ensure you're on HTTPS or localhost
- **Quick fix**: Skip scanner, type tile number manually

### Players not seeing updates?
- **Check**: Realtime replication enabled in Supabase
- **Fix**: Go to Database → Replication and enable tables

### Questions not loading?
- **Check**: SQL script ran successfully
- **Verify**: Run in Supabase SQL Editor:
  ```sql
  SELECT COUNT(*) FROM question;
  -- Should return 20
  ```

### Can't join room?
- **Check**: Room code is exactly 6 digits
- **Verify**: Game hasn't started yet (status = 'waiting')

## 🎯 What's Next?

### Customize Your Game:

**Add More Questions:**
```sql
INSERT INTO question (question_text, options, correct_answer, difficulty)
VALUES (
  'What is Python?',
  '["A programming language", "A snake", "A framework", "A database"]',
  'A programming language',
  'easy'
);
```

**Change Scoring:**
Edit `src/lib/database.ts` → `submitAnswer` function

**Adjust Time Limits:**
Edit `src/lib/database.ts` → `getTimeLimit` function

### Play with Friends:
1. Deploy to Vercel (see README.md)
2. Share your URL
3. Start playing online!

## 📚 Documentation

- **README.md** → Full project overview
- **SETUP.md** → Detailed setup guide
- **IMPLEMENTATION.md** → Technical details
- **supabase_setup.sql** → Database schema

## 🎉 You're Ready!

Your game is now fully functional. Gather your friends, print some tiles, and start playing!

### Game Flow Reminder:
1. **Create/Join room** → Share code
2. **Host starts** → Game begins
3. **Roll dice** → Move forward
4. **Scan tile** → Question appears
5. **Everyone answers** → Scores update
6. **Next turn** → Repeat!

### Tips for Best Experience:
- Use physical dice for authenticity
- Print colorful tiles
- Play with 2-4 players
- Set a win condition (first to 100 points?)
- Have fun learning Python! 🐍

---

**Need Help?** Check SETUP.md troubleshooting or open an issue on GitHub.

**Happy Gaming! 🎮✨**
