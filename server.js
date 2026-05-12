const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const os = require('os');

const PORT = process.env.PORT || 3000;
const DEFAULT_DURATION = 180;

// --- Dictionary ---
let DICT = null;
let DICT_WORDS = []; // array for random selection during board generation
const DICT_URL = 'https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-no-swears.txt';

async function loadDict() {
  try {
    const https = require('https');
    const text = await new Promise((resolve, reject) => {
      https.get(DICT_URL, res => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });
    const words = text.split('\n').map(w => w.trim().toLowerCase()).filter(w => w.length >= 3 && /^[a-z]+$/.test(w));
    DICT = new Set(words);
    DICT_WORDS = words;
    console.log(`Dictionary loaded: ${DICT.size} words`);
  } catch (e) {
    console.error('Failed to load dictionary:', e.message);
  }
}

// --- Board generation ---
const FILL_LETTERS = 'AAABCDEEEFGHIIIJKLMNOOOPQRSTUUVWXYZ';

function generateBoard(size) {
  const board = new Array(size * size).fill(null);

  // Try to place words on the board
  const wordsPlaced = [];
  const maxAttempts = 100;

  for (let attempt = 0; attempt < maxAttempts && wordsPlaced.length < size; attempt++) {
    // Pick a random word that fits the board
    const word = pickWord(size);
    if (!word) continue;

    const path = tryPlaceWord(word, board, size);
    if (path) {
      for (let i = 0; i < path.length; i++) {
        board[path[i]] = word[i].toUpperCase();
      }
      wordsPlaced.push(word);
    }
  }

  // Fill remaining empty cells with random letters
  for (let i = 0; i < board.length; i++) {
    if (!board[i]) board[i] = FILL_LETTERS[Math.floor(Math.random() * FILL_LETTERS.length)];
  }

  console.log(`Board generated: placed ${wordsPlaced.length} words: ${wordsPlaced.join(', ')}`);
  return board;
}

function pickWord(size) {
  if (!DICT_WORDS.length) return null;
  const maxLen = Math.min(size * 2, 8); // don't try words longer than reasonable path
  for (let i = 0; i < 20; i++) {
    const w = DICT_WORDS[Math.floor(Math.random() * DICT_WORDS.length)];
    if (w.length >= 3 && w.length <= maxLen && !w.includes('q')) return w;
  }
  return null;
}

function tryPlaceWord(word, board, size) {
  // Try multiple random starting positions
  const cells = [...Array(size * size).keys()];
  shuffle(cells);

  for (const startCell of cells.slice(0, 15)) {
    const path = findPath(word, 0, startCell, [], board, size);
    if (path) return path;
  }
  return null;
}

function findPath(word, charIdx, cell, visited, board, size) {
  if (charIdx >= word.length) return visited;
  if (cell < 0 || cell >= size * size) return null;
  if (visited.includes(cell)) return null;

  const existing = board[cell];
  if (existing && existing.toLowerCase() !== word[charIdx]) return null;

  const newVisited = [...visited, cell];
  if (charIdx === word.length - 1) return newVisited;

  const neighbors = getAdj(cell, size);
  shuffle(neighbors);
  for (const next of neighbors) {
    const result = findPath(word, charIdx + 1, next, newVisited, board, size);
    if (result) return result;
  }
  return null;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getAdj(idx, size) {
  const r = Math.floor(idx / size), c = idx % size, adj = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if (!dr && !dc) continue;
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < size && nc >= 0 && nc < size) adj.push(nr * size + nc);
  }
  return adj;
}

function isValidPath(wordPath, size) {
  for (let i = 1; i < wordPath.length; i++) {
    if (!getAdj(wordPath[i - 1], size).includes(wordPath[i])) return false;
    if (wordPath.slice(0, i).includes(wordPath[i])) return false;
  }
  return true;
}

// --- Rooms ---
const rooms = {};

function genCode() {
  let code;
  do { code = Math.random().toString(36).substring(2, 6).toUpperCase(); } while (rooms[code]);
  return code;
}

function createRoom() {
  const code = genCode();
  rooms[code] = {
    code,
    display: null,
    players: {},
    hostName: null,
    board: generateBoard(4),
    gridSize: 4,
    minWordLen: 3,
    duration: DEFAULT_DURATION,
    timer: null,
    timeLeft: DEFAULT_DURATION,
    state: 'lobby',
    typing: new Set(),
  };
  return rooms[code];
}

function broadcastAll(room, msg) {
  const data = JSON.stringify(msg);
  if (room.display && room.display.readyState === 1) room.display.send(data);
  Object.values(room.players).forEach(p => {
    if (p.ws && p.ws.readyState === 1) p.ws.send(data);
  });
}

function sendToDisplay(room, msg) {
  if (room.display && room.display.readyState === 1) room.display.send(JSON.stringify(msg));
}

function sendTo(ws, msg) {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg));
}

function getPlayerList(room) {
  return Object.entries(room.players)
    .filter(([, p]) => p.ws && p.ws.readyState === 1)
    .map(([name, p]) => ({
      name, score: p.score, wordCount: p.words.length, isHost: name === room.hostName
    }));
}

function assignHost(room) {
  const connected = Object.entries(room.players).filter(([, p]) => p.ws && p.ws.readyState === 1);
  if (connected.length === 0) { room.hostName = null; return; }
  if (room.hostName && room.players[room.hostName] && room.players[room.hostName].ws && room.players[room.hostName].ws.readyState === 1) return;
  room.hostName = connected[0][0];
  broadcastAll(room, { type: 'host-changed', hostName: room.hostName, players: getPlayerList(room) });
}

function startGame(room) {
  room.state = 'playing';
  room.timeLeft = room.duration;
  Object.values(room.players).forEach(p => { p.words = []; p.score = 0; });
  broadcastAll(room, { type: 'game-start', board: room.board, gridSize: room.gridSize, minWordLen: room.minWordLen, duration: room.duration, timeLeft: room.timeLeft });
  room.timer = setInterval(() => {
    room.timeLeft--;
    if (room.timeLeft <= 0) {
      clearInterval(room.timer);
      room.state = 'ended';
      endGame(room);
    } else {
      broadcastAll(room, { type: 'tick', timeLeft: room.timeLeft });
    }
  }, 1000);
}

function endGame(room) {
  const results = {};
  Object.entries(room.players).forEach(([name, p]) => {
    results[name] = { words: p.words, score: p.score };
  });
  broadcastAll(room, { type: 'game-end', results, hostName: room.hostName });
}

function resetRoom(room, config) {
  if (room.timer) clearInterval(room.timer);
  room.gridSize = config.gridSize || room.gridSize;
  room.minWordLen = config.minWordLen || room.minWordLen;
  room.duration = config.duration || room.duration;
  room.board = generateBoard(room.gridSize);
  room.timeLeft = room.duration;
  room.state = 'lobby';
  Object.values(room.players).forEach(p => { p.words = []; p.score = 0; });
}

// --- HTTP server ---
const server = http.createServer((req, res) => {
  let filePath;
  const url = req.url.split('?')[0];
  if (url === '/' || url === '/host') filePath = path.join(__dirname, 'host.html');
  else if (url === '/play') filePath = path.join(__dirname, 'player.html');
  else { res.writeHead(404); res.end('Not found'); return; }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(500); res.end('Error'); return; }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
});

// --- WebSocket server ---
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  let role = null;
  let room = null;
  let playerName = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {
      case 'create-room': {
        room = createRoom();
        room.display = ws;
        role = 'display';
        sendTo(ws, { type: 'room-created', code: room.code, gridSize: room.gridSize, minWordLen: room.minWordLen, duration: room.duration });
        break;
      }
      case 'joining': {
        const r = rooms[msg.code && msg.code.toUpperCase()];
        if (!r) return;
        room = r;
        r.typing.add(ws);
        sendToDisplay(r, { type: 'typing-update', count: r.typing.size });
        break;
      }
      case 'join': {
        const r = rooms[msg.code && msg.code.toUpperCase()];
        if (!r) { sendTo(ws, { type: 'error', message: 'Room not found' }); return; }
        if (r.state === 'ended') { sendTo(ws, { type: 'error', message: 'Game already ended' }); return; }
        room = r;
        role = 'player';
        playerName = msg.name || `Player${Object.keys(room.players).length + 1}`;
        // Reconnection: if player exists but disconnected, restore them
        if (room.players[playerName] && (!room.players[playerName].ws || room.players[playerName].ws.readyState !== 1)) {
          room.players[playerName].ws = ws;
        } else if (room.players[playerName] && room.players[playerName].ws && room.players[playerName].ws.readyState === 1) {
          playerName += Math.floor(Math.random() * 99);
          room.players[playerName] = { ws, words: [], score: 0 };
        } else {
          room.players[playerName] = { ws, words: [], score: 0 };
        }
        if (!room.hostName) room.hostName = playerName;
        const isHostPlayer = playerName === room.hostName;
        const currentState = room.state === 'paused' ? 'playing' : room.state;
        sendTo(ws, { type: 'joined', name: playerName, isHost: isHostPlayer, state: currentState, board: (room.state === 'playing' || room.state === 'paused') ? room.board : null, gridSize: room.gridSize, minWordLen: room.minWordLen, duration: room.duration, timeLeft: room.timeLeft });
        // Remove from typing and notify
        room.typing.delete(ws);
        broadcastAll(room, { type: 'player-joined', players: getPlayerList(room), hostName: room.hostName });
        sendToDisplay(room, { type: 'typing-update', count: room.typing.size });
        // Auto-resume if game was paused
        if (room.state === 'paused') {
          room.state = 'playing';
          room.timer = setInterval(() => {
            room.timeLeft--;
            if (room.timeLeft <= 0) { clearInterval(room.timer); room.state = 'ended'; endGame(room); }
            else { broadcastAll(room, { type: 'tick', timeLeft: room.timeLeft }); }
          }, 1000);
          broadcastAll(room, { type: 'game-resumed', timeLeft: room.timeLeft });
        }
        break;
      }
      case 'start-game': {
        if (!room || playerName !== room.hostName) return;
        if (room.state === 'playing') return;
        if (msg.gridSize) room.gridSize = msg.gridSize;
        if (msg.minWordLen) room.minWordLen = msg.minWordLen;
        if (msg.duration) room.duration = msg.duration;
        room.board = generateBoard(room.gridSize);
        startGame(room);
        break;
      }
      case 'update-settings': {
        if (!room || playerName !== room.hostName) return;
        if (room.state === 'playing') return;
        if (msg.gridSize) room.gridSize = msg.gridSize;
        if (msg.minWordLen) room.minWordLen = msg.minWordLen;
        if (msg.duration) room.duration = msg.duration;
        sendToDisplay(room, { type: 'settings-changed', gridSize: room.gridSize, minWordLen: room.minWordLen, duration: room.duration });
        break;
      }
      case 'restart': {
        if (!room || playerName !== room.hostName) return;
        resetRoom(room, { gridSize: msg.gridSize, minWordLen: msg.minWordLen, duration: msg.duration });
        broadcastAll(room, { type: 'new-round', state: room.state, board: room.board, gridSize: room.gridSize, minWordLen: room.minWordLen, duration: room.duration, players: getPlayerList(room), hostName: room.hostName });
        break;
      }
      case 'resume-game': {
        if (!room || room.state !== 'paused') return;
        room.state = 'playing';
        room.timer = setInterval(() => {
          room.timeLeft--;
          if (room.timeLeft <= 0) {
            clearInterval(room.timer);
            room.state = 'ended';
            endGame(room);
          } else {
            broadcastAll(room, { type: 'tick', timeLeft: room.timeLeft });
          }
        }, 1000);
        broadcastAll(room, { type: 'game-resumed', timeLeft: room.timeLeft });
        break;
      }
      case 'submit-word': {
        if (role !== 'player' || !room || room.state !== 'playing') return;
        const { path: wordPath } = msg;
        const player = room.players[playerName];
        if (!wordPath || !Array.isArray(wordPath)) return;
        if (!isValidPath(wordPath, room.gridSize)) { sendTo(ws, { type: 'word-result', valid: false, reason: 'Invalid path' }); return; }
        const word = wordPath.map(i => room.board[i] === 'Q' ? 'QU' : room.board[i]).join('');
        if (word.length < room.minWordLen) { sendTo(ws, { type: 'word-result', valid: false, reason: `Min ${room.minWordLen} letters` }); return; }
        if (player.words.includes(word)) { sendTo(ws, { type: 'word-result', valid: false, reason: 'Already found' }); return; }
        if (!DICT || !DICT.has(word.toLowerCase())) { sendTo(ws, { type: 'word-result', valid: false, reason: 'Not in dictionary' }); return; }
        const pts = [0, 0, 0, 2, 3, 5, 8, 13, 21][Math.min(word.length, 8)];
        player.words.push(word);
        player.score += pts;
        sendTo(ws, { type: 'word-result', valid: true, word, points: pts, totalScore: player.score });
        sendToDisplay(room, { type: 'score-update', players: getPlayerList(room) });
        break;
      }
    }
  });

  ws.on('close', () => {
    // Clean up typing state
    if (room && room.typing && room.typing.has(ws)) {
      room.typing.delete(ws);
      sendToDisplay(room, { type: 'typing-update', count: room.typing.size });
    }
    if (role === 'player' && room && playerName) {
      if (room.players[playerName]) room.players[playerName].ws = null;
      // Pause game if mid-game
      if (room.state === 'playing') {
        clearInterval(room.timer);
        room.state = 'paused';
        broadcastAll(room, { type: 'game-paused', disconnectedPlayer: playerName, players: getPlayerList(room), hostName: room.hostName });
      }
      if (playerName === room.hostName) {
        room.hostName = null;
        assignHost(room);
      }
      broadcastAll(room, { type: 'player-left', name: playerName, players: getPlayerList(room), hostName: room.hostName });
    }
    if (role === 'display' && room) {
      room.display = null;
      // Clean up room if no players connected
      const connected = Object.values(room.players).filter(p => p.ws && p.ws.readyState === 1);
      if (connected.length === 0) {
        if (room.timer) clearInterval(room.timer);
        delete rooms[room.code];
      }
    }
  });
});

// --- Get local IP ---
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const addr of iface) {
      if (addr.family === 'IPv4' && !addr.internal) return addr.address;
    }
  }
  return 'localhost';
}

// --- Start ---
loadDict().then(() => {
  server.listen(PORT, () => {
    const ip = getLocalIP();
    console.log(`\n🎲 Boggle Party Server running!`);
    console.log(`   Display screen: http://${ip}:${PORT}/`);
    console.log(`   Players join:   http://${ip}:${PORT}/play\n`);
  });
});
