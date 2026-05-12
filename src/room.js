'use strict';

const config = require('./config');
const board = require('./board');
const dictionary = require('./dictionary');
const log = require('./logger');

const rooms = new Map();

const SCORE_TABLE = [0, 0, 0, 2, 3, 5, 8, 13, 21];

function genCode() {
  let code;
  do {
    code = Math.random().toString(36).substring(2, 6).toUpperCase();
  } while (rooms.has(code));
  return code;
}

function create() {
  const code = genCode();
  const room = {
    code,
    display: null,
    players: {},
    hostName: null,
    board: board.generate(config.game.defaultGridSize),
    gridSize: config.game.defaultGridSize,
    minWordLen: config.game.defaultMinWordLen,
    duration: config.game.defaultDuration,
    timer: null,
    timeLeft: config.game.defaultDuration,
    state: 'lobby',
    typing: new Set(),
  };
  rooms.set(code, room);
  log.info('Room created', { code });
  return room;
}

function get(code) {
  return rooms.get(code && code.toUpperCase()) || null;
}

function destroy(code) {
  const room = rooms.get(code);
  if (room) {
    if (room.timer) clearInterval(room.timer);
    rooms.delete(code);
    log.info('Room destroyed', { code });
  }
}

function getPlayerList(room) {
  return Object.entries(room.players)
    .filter(([, p]) => p.ws && p.ws.readyState === 1)
    .map(([name, p]) => ({
      name, score: p.score, wordCount: p.words.length, isHost: name === room.hostName,
    }));
}

function assignHost(room) {
  const connected = Object.entries(room.players)
    .filter(([, p]) => p.ws && p.ws.readyState === 1);
  if (connected.length === 0) { room.hostName = null; return; }
  const currentHost = room.players[room.hostName];
  if (room.hostName && currentHost && currentHost.ws && currentHost.ws.readyState === 1) return;
  room.hostName = connected[0][0];
}

function startGame(room, broadcast) {
  room.state = 'playing';
  room.timeLeft = room.duration;
  Object.values(room.players).forEach(p => { p.words = []; p.score = 0; });

  broadcast(room, {
    type: 'game-start', board: room.board, gridSize: room.gridSize,
    minWordLen: room.minWordLen, duration: room.duration, timeLeft: room.timeLeft,
  });

  room.timer = setInterval(() => {
    room.timeLeft--;
    if (room.timeLeft <= 0) {
      clearInterval(room.timer);
      room.timer = null;
      room.state = 'ended';
      endGame(room, broadcast);
    } else {
      broadcast(room, { type: 'tick', timeLeft: room.timeLeft });
    }
  }, 1000);

  log.info('Game started', { code: room.code, players: Object.keys(room.players).length });
}

function endGame(room, broadcast) {
  const results = {};
  Object.entries(room.players).forEach(([name, p]) => {
    results[name] = { words: p.words, score: p.score };
  });
  broadcast(room, { type: 'game-end', results, hostName: room.hostName, board: room.board, gridSize: room.gridSize });
  log.info('Game ended', { code: room.code });
}

function resetRoom(room, cfg) {
  if (room.timer) clearInterval(room.timer);
  room.timer = null;
  room.gridSize = cfg.gridSize || room.gridSize;
  room.minWordLen = cfg.minWordLen || room.minWordLen;
  room.duration = cfg.duration || room.duration;
  room.board = board.generate(room.gridSize);
  room.timeLeft = room.duration;
  room.state = 'lobby';
  Object.values(room.players).forEach(p => { p.words = []; p.score = 0; });
}

function resumeTimer(room, broadcast) {
  room.state = 'playing';
  room.timer = setInterval(() => {
    room.timeLeft--;
    if (room.timeLeft <= 0) {
      clearInterval(room.timer);
      room.timer = null;
      room.state = 'ended';
      endGame(room, broadcast);
    } else {
      broadcast(room, { type: 'tick', timeLeft: room.timeLeft });
    }
  }, 1000);
}

function submitWord(room, playerName, wordPath) {
  const player = room.players[playerName];
  if (!player || !wordPath || !Array.isArray(wordPath)) return { valid: false, reason: 'Invalid submission' };
  if (!board.isValidPath(wordPath, room.gridSize)) return { valid: false, reason: 'Invalid path' };

  const word = wordPath.map(i => room.board[i] === 'Q' ? 'QU' : room.board[i]).join('');
  if (word.length < room.minWordLen) return { valid: false, reason: `Min ${room.minWordLen} letters` };
  if (player.words.some(w => w.word === word)) return { valid: false, reason: 'Already found' };
  if (!dictionary.isValid(word)) return { valid: false, reason: 'Not in dictionary' };

  const pts = SCORE_TABLE[Math.min(word.length, 8)];
  player.words.push({ word, path: wordPath });
  player.score += pts;

  return { valid: true, word, points: pts, totalScore: player.score };
}

function getRoomCount() {
  return rooms.size;
}

module.exports = {
  create, get, destroy, getPlayerList, assignHost,
  startGame, endGame, resetRoom, resumeTimer, submitWord, getRoomCount,
};
