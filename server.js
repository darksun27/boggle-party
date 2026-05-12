'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { WebSocketServer } = require('ws');

const config = require('./src/config');
const log = require('./src/logger');
const dictionary = require('./src/dictionary');
const room = require('./src/room');

// --- HTTP Server ---

const DIST_DIR = path.join(__dirname, 'dist');

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];

  if (url === '/health') {
    const status = { ok: true, dictLoaded: dictionary.isLoaded(), rooms: room.getRoomCount() };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(status));
    return;
  }

  if (url === '/test-results' && process.env.NODE_ENV !== 'production') {
    // Serve host.html but the WS will receive dummy game-end data
    const filePath = path.join(DIST_DIR, 'host.html');
    fs.readFile(filePath, 'utf8', (err, html) => {
      if (err) { res.writeHead(500); res.end('Error'); return; }
      const script = `<script>
        // Board layout:
        // C A T S
        // R E A L
        // D E N T
        // S T A R
        window.__TEST_RESULTS__ = {
          results: {
            "Alice": { words: [{word:"STAR",path:[3,2,1,4]},{word:"RATE",path:[4,1,2,5]},{word:"REAL",path:[4,5,6,7]},{word:"DEAL",path:[8,5,6,7]},{word:"RENT",path:[4,5,10,11]},{word:"DENT",path:[8,5,10,11]},{word:"STEAL",path:[3,2,5,6,7]},{word:"STARE",path:[3,2,1,4,5]},{word:"RENTAL",path:[4,5,10,11,6,7]}], score: 38 },
            "Bob": { words: [{word:"STAR",path:[3,2,1,4]},{word:"RATE",path:[4,1,2,5]},{word:"NEAT",path:[10,5,1,2]},{word:"CATS",path:[0,1,2,3]},{word:"CRATE",path:[0,4,1,2,5]},{word:"STARED",path:[3,2,1,4,5,8]}], score: 28 },
            "Charlie": { words: [{word:"STAR",path:[3,2,1,4]},{word:"DEAL",path:[8,5,6,7]},{word:"RENT",path:[4,5,10,11]},{word:"ATE",path:[1,2,5]},{word:"RENTED",path:[4,5,10,13,9,8]},{word:"DENTAL",path:[8,5,10,11,6,7]}], score: 27 }
          },
          board: ["C","A","T","S","R","E","A","L","D","E","N","T","S","T","A","R"],
          gridSize: 4
        };
      </script>`;
      res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache' });
      res.end(html.replace('</head>', script + '</head>'));
    });
    return;
  }

  let filePath;
  if (url === '/' || url === '/host') filePath = path.join(DIST_DIR, 'host.html');
  else if (url === '/play') filePath = path.join(DIST_DIR, 'player.html');
  else filePath = path.join(DIST_DIR, url);

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(filePath);
    const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
    const cacheControl = ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable';
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream', 'Cache-Control': cacheControl });
    fs.createReadStream(filePath).pipe(res);
  });
});

// --- WebSocket Helpers ---

function sendTo(ws, msg) {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg));
}

function broadcastAll(r, msg) {
  const data = JSON.stringify(msg);
  if (r.display && r.display.readyState === 1) r.display.send(data);
  Object.values(r.players).forEach(p => {
    if (p.ws && p.ws.readyState === 1) p.ws.send(data);
  });
}

function sendToDisplay(r, msg) {
  if (r.display && r.display.readyState === 1) r.display.send(JSON.stringify(msg));
}

// --- WebSocket Server ---

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  let role = null;
  let currentRoom = null;
  let playerName = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {
      case 'create-room': {
        currentRoom = room.create();
        currentRoom.display = ws;
        role = 'display';
        sendTo(ws, {
          type: 'room-created', code: currentRoom.code,
          gridSize: currentRoom.gridSize, minWordLen: currentRoom.minWordLen, duration: currentRoom.duration,
        });
        break;
      }

      case 'joining': {
        const r = room.get(msg.code);
        if (!r) return;
        currentRoom = r;
        r.typing.add(ws);
        sendToDisplay(r, { type: 'typing-update', count: r.typing.size });
        break;
      }

      case 'join': {
        const r = room.get(msg.code);
        if (!r) { sendTo(ws, { type: 'error', message: 'Room not found' }); return; }
        if (r.state === 'ended') { sendTo(ws, { type: 'error', message: 'Game already ended' }); return; }

        currentRoom = r;
        role = 'player';
        playerName = msg.name || `Player${Object.keys(r.players).length + 1}`;

        // Reconnection or new player
        if (r.players[playerName] && (!r.players[playerName].ws || r.players[playerName].ws.readyState !== 1)) {
          r.players[playerName].ws = ws;
        } else if (r.players[playerName]) {
          playerName += Math.floor(Math.random() * 99);
          r.players[playerName] = { ws, words: [], score: 0 };
        } else {
          r.players[playerName] = { ws, words: [], score: 0 };
        }

        if (!r.hostName) r.hostName = playerName;

        sendTo(ws, {
          type: 'joined', name: playerName, isHost: playerName === r.hostName,
          state: r.state === 'paused' ? 'playing' : r.state,
          board: (r.state === 'playing' || r.state === 'paused') ? r.board : null,
          gridSize: r.gridSize, minWordLen: r.minWordLen, duration: r.duration, timeLeft: r.timeLeft,
        });

        r.typing.delete(ws);
        broadcastAll(r, { type: 'player-joined', players: room.getPlayerList(r), hostName: r.hostName });
        sendToDisplay(r, { type: 'typing-update', count: r.typing.size });

        // Auto-resume paused game
        if (r.state === 'paused') {
          room.resumeTimer(r, broadcastAll);
          broadcastAll(r, { type: 'game-resumed', timeLeft: r.timeLeft });
        }
        break;
      }

      case 'start-game': {
        if (!currentRoom || playerName !== currentRoom.hostName) return;
        if (currentRoom.state === 'playing') return;
        if (msg.gridSize) currentRoom.gridSize = msg.gridSize;
        if (msg.minWordLen) currentRoom.minWordLen = msg.minWordLen;
        if (msg.duration) currentRoom.duration = msg.duration;
        const board = require('./src/board');
        currentRoom.board = board.generate(currentRoom.gridSize);
        room.startGame(currentRoom, broadcastAll);
        break;
      }

      case 'update-settings': {
        if (!currentRoom || playerName !== currentRoom.hostName) return;
        if (currentRoom.state === 'playing') return;
        if (msg.gridSize) currentRoom.gridSize = msg.gridSize;
        if (msg.minWordLen) currentRoom.minWordLen = msg.minWordLen;
        if (msg.duration) currentRoom.duration = msg.duration;
        sendToDisplay(currentRoom, {
          type: 'settings-changed', gridSize: currentRoom.gridSize,
          minWordLen: currentRoom.minWordLen, duration: currentRoom.duration,
        });
        break;
      }

      case 'restart': {
        if (!currentRoom || playerName !== currentRoom.hostName) return;
        room.resetRoom(currentRoom, { gridSize: msg.gridSize, minWordLen: msg.minWordLen, duration: msg.duration });
        broadcastAll(currentRoom, {
          type: 'new-round', state: currentRoom.state, board: currentRoom.board,
          gridSize: currentRoom.gridSize, minWordLen: currentRoom.minWordLen,
          duration: currentRoom.duration, players: room.getPlayerList(currentRoom), hostName: currentRoom.hostName,
        });
        break;
      }

      case 'resume-game': {
        if (!currentRoom || currentRoom.state !== 'paused') return;
        room.resumeTimer(currentRoom, broadcastAll);
        broadcastAll(currentRoom, { type: 'game-resumed', timeLeft: currentRoom.timeLeft });
        break;
      }

      case 'results-complete': {
        if (!currentRoom || role !== 'display') return;
        broadcastAll(currentRoom, { type: 'results-complete' });
        break;
      }

      case 'submit-word': {
        if (role !== 'player' || !currentRoom || currentRoom.state !== 'playing') return;
        const result = room.submitWord(currentRoom, playerName, msg.path);
        sendTo(ws, { type: 'word-result', ...result });
        if (result.valid) {
          sendToDisplay(currentRoom, { type: 'score-update', players: room.getPlayerList(currentRoom) });
        }
        break;
      }
    }
  });

  ws.on('close', () => {
    if (!currentRoom) return;

    // Clean up typing
    if (currentRoom.typing.has(ws)) {
      currentRoom.typing.delete(ws);
      sendToDisplay(currentRoom, { type: 'typing-update', count: currentRoom.typing.size });
    }

    if (role === 'player' && playerName) {
      if (currentRoom.players[playerName]) currentRoom.players[playerName].ws = null;

      // Pause if mid-game
      if (currentRoom.state === 'playing') {
        if (currentRoom.timer) clearInterval(currentRoom.timer);
        currentRoom.timer = null;
        currentRoom.state = 'paused';
        broadcastAll(currentRoom, {
          type: 'game-paused', disconnectedPlayer: playerName,
          players: room.getPlayerList(currentRoom), hostName: currentRoom.hostName,
        });
      }

      if (playerName === currentRoom.hostName) {
        currentRoom.hostName = null;
        room.assignHost(currentRoom);
        broadcastAll(currentRoom, {
          type: 'host-changed', hostName: currentRoom.hostName,
          players: room.getPlayerList(currentRoom),
        });
      }

      broadcastAll(currentRoom, {
        type: 'player-left', name: playerName,
        players: room.getPlayerList(currentRoom), hostName: currentRoom.hostName,
      });
    }

    if (role === 'display') {
      currentRoom.display = null;
      const connected = Object.values(currentRoom.players).filter(p => p.ws && p.ws.readyState === 1);
      if (connected.length === 0) {
        room.destroy(currentRoom.code);
      }
    }
  });

  ws.on('error', (err) => {
    log.error('WebSocket error', { error: err.message });
  });
});

// --- Graceful Shutdown ---

function shutdown(signal) {
  log.info('Shutdown initiated', { signal });

  wss.clients.forEach((ws) => {
    sendTo(ws, { type: 'error', message: 'Server shutting down' });
    ws.close(1001, 'Server shutting down');
  });

  wss.close(() => {
    server.close(() => {
      log.info('Server stopped');
      process.exit(0);
    });
  });

  // Force exit after 5s
  setTimeout(() => {
    log.warn('Forced shutdown');
    process.exit(1);
  }, 5000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  log.error('Uncaught exception', { error: err.message, stack: err.stack });
  shutdown('uncaughtException');
});
process.on('unhandledRejection', (reason) => {
  log.error('Unhandled rejection', { reason: String(reason) });
});

// --- Startup ---

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const addr of iface) {
      if (addr.family === 'IPv4' && !addr.internal) return addr.address;
    }
  }
  return 'localhost';
}

async function start() {
  await dictionary.load();

  server.listen(config.port, () => {
    const ip = getLocalIP();
    log.info('Server started', { port: config.port, ip });
    // Human-friendly output for local dev
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n🎲 Boggle Party Server running!`);
      console.log(`   Display: http://${ip}:${config.port}/`);
      console.log(`   Players: http://${ip}:${config.port}/play`);
      console.log(`   Health:  http://${ip}:${config.port}/health\n`);
    }
  });
}

start().catch((err) => {
  log.error('Failed to start', { error: err.message });
  process.exit(1);
});
