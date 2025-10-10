# FlowQuest 🎮

**FlowQuest** is a multiplayer educational hybrid board game that combines physical board tiles with digital quiz questions. Players scan QR codes on physical tiles to trigger Python control flow quiz questions, compete in real-time, and collect power-ups.

## 🎯 Features

### Core Gameplay
- **Hybrid Board Game**: Physical board with QR-coded tiles + digital quiz interface
- **Multiplayer Support**: 2+ players in real-time with instant synchronization
- **Turn-Based System**: Players take turns moving, scanning tiles, and answering questions
- **Free-for-All Mode**: All players answer each question simultaneously
- **Real-time Scoring**: Instant score updates visible to all players

### Quiz System
- **Difficulty Levels**: Easy, Medium, Hard questions with appropriate time limits
- **Dynamic Timing**: 20-50 seconds per question based on difficulty
- **Speed Bonus**: Faster correct answers earn more points
- **No Repeats**: Questions never repeat within the same game session
- **Comprehensive Topics**: Python control flow, loops, conditionals, functions, and more

### Technical Features
- **QR Code Integration**: Scan room codes and board tiles
- **Real-time Sync**: Supabase Realtime for instant updates
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Authentication**: Secure user accounts with Supabase Auth
- **Database-Driven**: PostgreSQL with Row Level Security

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm (or npm/yarn)
- Supabase account
- Mobile device with camera

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/flowquest.git
cd flowquest
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the SQL in `supabase_schema.sql` in your Supabase SQL Editor
   - Enable Realtime for tables: `game_sessions`, `session_players`, `session_questions`, `question_attempts`

4. **Configure environment variables**
```bash
# Create .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. **Run development server**
```bash
pnpm dev
```

Visit `http://localhost:3000` 🎉

## 📖 How to Play

### 1. Create or Join a Room
- **Host**: Click "Create Room" to generate a 6-digit room code and QR code
- **Players**: Click "Join Room" and enter the code or scan the QR code

### 2. Start the Game
- Wait for all players to join (minimum 2 players)
- Host clicks "Start Game" when ready

### 3. Take Your Turn
1. **Roll Dice**: Roll (physical or digital) to determine movement
2. **Move**: Advance your position on the board
3. **Scan Tile**: Scan the QR code on the tile you land on
4. **Answer Question**: A quiz question appears with a countdown timer
5. **Compete**: All players answer (Free-for-All mode)
6. **Score Points**: Earn points for correct answers (bonus for speed!)

### 4. Win the Game
- Highest score after all rounds wins
- Track progress on the real-time scoreboard

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (Node.js)
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime subscriptions
- **Authentication**: Supabase Auth
- **QR Codes**: html5-qrcode, qrcode libraries

### Project Structure
```
flowquest/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── rooms/        # Room management
│   │   │   ├── quiz/         # Quiz logic
│   │   │   └── game/         # Game state
│   │   ├── game/[id]/        # Game page
│   │   ├── room/             # Room pages
│   │   └── login/            # Auth pages
│   ├── components/           # React components
│   ├── hooks/                # Custom hooks
│   ├── lib/                  # Database helpers
│   ├── types/                # TypeScript types
│   └── utils/                # Utilities
├── public/                   # Static assets
├── supabase_schema.sql       # Database schema
└── SETUP.md                  # Detailed setup guide
```

### Database Schema
- **users**: User profiles
- **game_sessions**: Game rooms and state
- **session_players**: Players in each game
- **questions**: Quiz question bank
- **session_questions**: Questions asked per game
- **question_attempts**: Player answers and scores
- **powerups**: Available power-ups
- **player_powerups**: Power-ups owned by players

## 🎮 Game Mechanics

### Scoring System
- **Easy Questions**: 10 base points, 20 seconds
- **Medium Questions**: 15 base points, 35 seconds
- **Hard Questions**: 20 base points, 50 seconds
- **Speed Bonus**: Up to 50% extra points for fast answers

Formula: `points = base_points × (1 + time_bonus)`

### Turn System
1. Current player rolls dice
2. Current player moves and scans tile
3. Question triggered for all players
4. All players submit answers
5. Scores updated in real-time
6. Next player's turn begins automatically

## 🛠️ Development

### Run Tests
```bash
pnpm test
```

### Build for Production
```bash
pnpm build
pnpm start
```

### Lint Code
```bash
pnpm lint
```

## 📱 Creating Physical Board

### Materials Needed
- Printed tiles with QR codes (20-30 tiles recommended)
- Lamination (for durability)
- Physical dice (or use digital dice in app)
- Player tokens/pieces

### Generate Tile QR Codes
Each tile needs a unique QR code. Use this format:
```json
{"type": "tile", "position": 1}
```

Or simply the tile number: `1`, `2`, `3`, etc.

Generate QR codes using:
- The built-in QRCodeDisplay component
- Online QR generators
- Command line tools

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- Users can only modify their own data
- API routes verify authentication
- Secure session management with Supabase Auth

## 🚀 Deployment

### Deploy to Vercel
1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Update Supabase Settings
- Add production URL to Site URL
- Add `https://your-domain.com/auth/callback` to Redirect URLs

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

MIT License - See LICENSE file for details

## 🎓 Educational Use

FlowQuest is designed for educational purposes to teach:
- Python programming concepts
- Control flow (if/else, loops, functions)
- Problem-solving skills
- Collaborative learning

Perfect for:
- Coding bootcamps
- Computer science classes
- Study groups
- Programming workshops

## 🐛 Troubleshooting

**Camera not working?**
- Enable camera permissions in browser
- Use HTTPS (required for camera access)

**Realtime not syncing?**
- Check Supabase replication is enabled
- Verify RLS policies

**Can't join room?**
- Ensure game status is 'waiting'
- Check room code is correct

See [SETUP.md](./SETUP.md) for detailed troubleshooting.

## 📚 Documentation

- [Setup Guide](./SETUP.md) - Detailed installation and configuration
- [API Documentation](./docs/api.md) - API route documentation (coming soon)
- [Database Schema](./supabase_schema.sql) - Complete database structure

## 🌟 Future Enhancements

- [ ] Power-up implementation in gameplay
- [ ] Game statistics and history
- [ ] Global leaderboards
- [ ] Custom question sets
- [ ] Team mode
- [ ] Voice chat
- [ ] Animated board visualization
- [ ] Achievement system

## 💬 Support

For questions or issues:
- Check [SETUP.md](./SETUP.md) troubleshooting
- Open a GitHub issue
- Review Supabase logs

---

Made with ❤️ for educators and learners everywhere. Happy coding! 🚀
