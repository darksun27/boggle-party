const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const os = require('os');

const PORT = 3000;
const DEFAULT_DURATION = 180;

// --- Dictionary ---
let DICT = null;
const DICT_URL = 'https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt';

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
    DICT = new Set(text.split('\n').map(w => w.trim().toLowerCase()).filter(w => w.length >= 3));
    console.log(`Dictionary loaded: ${DICT.size} words`);
  } catch (e) {
    console.error('Failed to load dictionary:', e.message);
  }
}

// --- Board generation ---
const LETTERS = 'AAABCDEEEFGHIIIJKLMNOOOPQRSTUUVWXYZ';
function generateBoard(size) {
  const board = [];
  for (let i = 0; i < size * size; i++) {
    board.push(LETTERS[Math.floor(Math.random() * LETTERS.length)]);
  }
  return board;
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
  return Object.entries(room.players).map(([name, p]) => ({
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
  broadcastAll(room, { type: 'game-start', board: room.board, gridSize: room.gridSize, minWordLen: room.minWordLen, timeLeft: room.timeLeft });
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
      case 'join': {
        const r = rooms[msg.code && msg.code.toUpperCase()];
        if (!r) { sendTo(ws, { type: 'error', message: 'Room not found' }); return; }
        if (r.state === 'ended') { sendTo(ws, { type: 'error', message: 'Game already ended' }); return; }
        room = r;
        role = 'player';
        playerName = msg.name || `Player${Object.keys(room.players).length + 1}`;
        if (room.players[playerName] && room.players[playerName].ws && room.players[playerName].ws.readyState === 1) {
          playerName += Math.floor(Math.random() * 99);
        }
        room.players[playerName] = { ws, words: [], score: 0 };
        if (!room.hostName) room.hostName = playerName;
        const isHostPlayer = playerName === room.hostName;
        sendTo(ws, { type: 'joined', name: playerName, isHost: isHostPlayer, state: room.state, board: room.state === 'playing' ? room.board : null, gridSize: room.gridSize, minWordLen: room.minWordLen, duration: room.duration, timeLeft: room.timeLeft });
        broadcastAll(room, { type: 'player-joined', players: getPlayerList(room), hostName: room.hostName });
        break;
      }
      case 'start-game': {
        if (!room || playerName !== room.hostName) return;
        if (room.state === 'playing') return;
        startGame(room);
        break;
      }
      case 'restart': {
        if (!room || playerName !== room.hostName) return;
        resetRoom(room, { gridSize: msg.gridSize, minWordLen: msg.minWordLen, duration: msg.duration });
        broadcastAll(room, { type: 'new-round', state: room.state, board: room.board, gridSize: room.gridSize, minWordLen: room.minWordLen, duration: room.duration, players: getPlayerList(room), hostName: room.hostName });
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
        const pts = [0, 0, 0, 1, 1, 2, 3, 5, 11][Math.min(word.length, 8)];
        player.words.push(word);
        player.score += pts;
        sendTo(ws, { type: 'word-result', valid: true, word, points: pts, totalScore: player.score });
        sendToDisplay(room, { type: 'score-update', players: getPlayerList(room) });
        break;
      }
    }
  });

  ws.on('close', () => {
    if (role === 'player' && room && playerName) {
      if (room.players[playerName]) room.players[playerName].ws = null;
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
