# 🎯 QR Code Testing Guide for FlowQuest

## 📱 QR Code Format for Board Tiles

### Format
```json
{
  "type": "tile",
  "position": 1
}
```

The QR code contains JSON data with:
- **type**: Always `"tile"` for board tiles
- **position**: The tile number (1, 2, 3, etc.)

---

## 🧪 How to Test QR Scanning

### Option 1: Use the Built-in Tile Generator
1. Navigate to: `/tiles` page
2. Enter number of tiles (e.g., 20)
3. Click "Generate"
4. Display a QR code on another device or print it
5. During gameplay, scan the QR code with your phone camera

### Option 2: Generate Test QR Code Online
1. Go to any QR code generator (e.g., qr-code-generator.com)
2. Use this JSON as the content:
   ```json
   {"type":"tile","position":5}
   ```
3. Generate and scan during gameplay

### Option 3: Use a QR Code Generator App
1. Install a QR generator app on your phone
2. Create QR with text: `{"type":"tile","position":3}`
3. Display on one phone, scan with another during game

---

## 🎮 Testing Flow in the Game

### Step-by-Step Test Process:

1. **Start a Game**
   - Create room with 2+ players
   - Click "Start Game"

2. **Roll the Dice**
   - It's your turn
   - Click "Roll Dice" button
   - Dice shows random number (1-6)
   - Position updates automatically

3. **Scan QR Code**
   - Scanner opens automatically after dice roll
   - Point camera at QR code with tile data
   - App reads the JSON: `{"type":"tile","position":N}`

4. **Get Question**
   - API endpoint: `POST /api/quiz/question`
   - Payload sent:
     ```json
     {
       "sessionId": "room-uuid",
       "roundNumber": 0,
       "tilePosition": 5
     }
     ```
   - Receives random question from database

5. **Answer Question**
   - Question displays with timer
   - Select answer and submit
   - API endpoint: `POST /api/quiz/submit`

---

## 🔧 API Endpoints Involved

### 1. **Get Question**
**Endpoint**: `/api/quiz/question`
**Method**: POST
**Payload**:
```json
{
  "sessionId": "abc-123-def",
  "roundNumber": 0,
  "tilePosition": 5,
  "difficulty": "medium" // optional
}
```

### 2. **Submit Answer**
**Endpoint**: `/api/quiz/submit`
**Method**: POST
**Payload**:
```json
{
  "sessionQuestionId": "question-uuid",
  "playerId": "player-uuid",
  "answer": "Option B",
  "timeTaken": 15
}
```

---

## 🧪 Manual Testing Without Physical QR Codes

If you want to test without printing/scanning QR codes, you can:

### Browser Console Testing:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Simulate a scan by calling the handler directly:
```javascript
// In the game page console
const mockTileData = JSON.stringify({ type: 'tile', position: 5 });
// Then trigger the handleTileScan function with this data
```

### Modify Code for Testing:
Add a "Skip QR Scan" button temporarily:
```typescript
<button onClick={() => handleTileScan(JSON.stringify({ type: 'tile', position: 5 }))}>
  Skip QR (Test)
</button>
```

---

## 📋 QR Code Data Parsing Logic

The game parses QR codes in this order:

1. **Try JSON Parse**:
   ```typescript
   const parsedData = JSON.parse(data);
   tilePosition = parsedData.position || parsedData.tile;
   ```

2. **Fallback to Number**:
   If not JSON, extract numbers:
   ```typescript
   const num = parseInt(data.replace(/\D/g, ''));
   ```

3. **Use Current Position**:
   If all fails, uses player's current position

---

## ✅ Testing Checklist

- [ ] Generate QR codes from `/tiles` page
- [ ] QR codes contain correct JSON format
- [ ] Scanner opens after dice roll
- [ ] QR scan triggers question fetch
- [ ] Question displays with correct data
- [ ] Timer counts down properly
- [ ] Answer submission works
- [ ] Score updates after answer
- [ ] Turn advances to next player

---

## 🐛 Common Issues & Solutions

### Issue: "QR Scanner not opening"
**Solution**: Check if dice was rolled first. Scanner only opens after position update.

### Issue: "Invalid QR code"
**Solution**: Ensure QR contains JSON with `position` field or a plain number.

### Issue: "Failed to fetch question"
**Solution**: 
1. Check database has questions in `question` table
2. Run `supabase_setup.sql` to add sample questions
3. Verify `sessionId` is valid UUID

### Issue: "Camera permission denied"
**Solution**: Enable camera permissions in browser settings for your domain.

---

## 🎨 Quick Test QR Codes

Here are some test values you can encode:

| Tile | JSON Data |
|------|-----------|
| 1 | `{"type":"tile","position":1}` |
| 5 | `{"type":"tile","position":5}` |
| 10 | `{"type":"tile","position":10}` |
| 20 | `{"type":"tile","position":20}` |

Simple number format also works: `1`, `5`, `10`, `20`

---

## 📱 Recommended QR Testing Tools

1. **QR Code Generator**: https://www.qr-code-generator.com/
2. **QR Code Monkey**: https://www.qrcode-monkey.com/
3. **Online QR Scanner**: https://webqr.com/ (test scanning)
4. **Mobile App**: "QR Code Generator" (iOS/Android)
