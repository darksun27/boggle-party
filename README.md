# 🎲 Boggle Party

Multiplayer Boggle word game with a TV display screen and mobile player interface.

## How It Works

1. Open the host page on a TV/laptop — shows QR code and room code
2. Players scan QR or visit the URL on their phones
3. Host starts the game — everyone races to find words by dragging across adjacent letters
4. Results show on the TV with animated word reveal and podium

## Tech Stack

- **Server:** Node.js, WebSocket (ws)
- **Client:** React 18, Vite, Framer Motion, Tailwind CSS
- **Avatars:** boring-avatars (local SVG generation)
- **Sounds:** react-sounds (CDN-loaded effects)
- **Dictionary:** TWL Scrabble dictionary (178k words) + Google 10k common words for board seeding

## Local Development

```bash
# Install server deps
npm install

# Build client
npm run build

# Start server
npm start
```

Server runs at `http://localhost:3000`. Host display at `/`, player join at `/play`.

## Deploy to Render

- **Build Command:** `npm run build`
- **Start Command:** `npm start`
- **Environment:** Set `NODE_VERSION=20`

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `NODE_ENV` | - | Set to `production` for JSON-only logging |
| `LOG_LEVEL` | info | error, warn, info, debug |
| `GAME_DURATION` | 180 | Default game duration (seconds) |
| `GRID_SIZE` | 4 | Default grid size |
| `MIN_WORD_LEN` | 3 | Default minimum word length |
| `MIN_BOARD_WORDS` | 20 | Minimum findable words per board |

## Project Structure

```
├── server.js              # HTTP + WebSocket server
├── src/                   # Server modules
│   ├── config.js          # Environment configuration
│   ├── logger.js          # Structured JSON logging
│   ├── dictionary.js      # Word validation + board seeding
│   ├── board.js           # Board generation with guaranteed words
│   └── room.js            # Game state management
├── client/                # React frontend (Vite)
│   ├── src/shared/        # WebSocket hook, game context, sounds, avatars
│   ├── src/host/          # TV display screens
│   └── src/player/        # Mobile player screens
└── dist/                  # Built frontend (gitignored)
```
