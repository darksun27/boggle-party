'use strict';

const config = require('./config');
const dictionary = require('./dictionary');
const log = require('./logger');

const FILL_LETTERS = 'AAABCDEEEFGHIIIJKLMNOOOPQRSTUUVWXYZ';

function getAdj(idx, size) {
  const r = Math.floor(idx / size), c = idx % size, adj = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) adj.push(nr * size + nc);
    }
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

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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

function tryPlaceWord(word, board, size) {
  const cells = [...Array(size * size).keys()];
  shuffle(cells);
  for (const startCell of cells.slice(0, 15)) {
    const path = findPath(word, 0, startCell, [], board, size);
    if (path) return path;
  }
  return null;
}

function countBoardWords(board, size) {
  const dict = dictionary.getValidationDict();
  if (!dict) return 0;
  const found = new Set();
  const visited = new Array(size * size).fill(false);

  function dfs(idx, word) {
    if (word.length >= 3 && word.length <= config.game.maxWordLen && dict.has(word)) {
      found.add(word);
    }
    if (word.length >= config.game.maxWordLen) return;
    for (const adj of getAdj(idx, size)) {
      if (!visited[adj]) {
        visited[adj] = true;
        dfs(adj, word + board[adj].toLowerCase());
        visited[adj] = false;
      }
    }
  }

  for (let i = 0; i < board.length; i++) {
    visited[i] = true;
    dfs(i, board[i].toLowerCase());
    visited[i] = false;
  }
  return found.size;
}

function generate(size) {
  const { minBoardWords, maxSeedAttempts, maxRegenAttempts, maxSeedWords } = config.game;
  const maxWordLen = Math.min(size * 2, config.game.maxWordLen);

  for (let regen = 0; regen < maxRegenAttempts; regen++) {
    const board = new Array(size * size).fill(null);
    const wordsPlaced = [];

    for (let attempt = 0; attempt < maxSeedAttempts && wordsPlaced.length < maxSeedWords; attempt++) {
      const word = dictionary.getRandomSeedWord(maxWordLen);
      if (!word) continue;
      const path = tryPlaceWord(word, board, size);
      if (path) {
        for (let i = 0; i < path.length; i++) board[path[i]] = word[i].toUpperCase();
        wordsPlaced.push(word);
      }
    }

    for (let i = 0; i < board.length; i++) {
      if (!board[i]) board[i] = FILL_LETTERS[Math.floor(Math.random() * FILL_LETTERS.length)];
    }

    const findable = countBoardWords(board, size);
    if (findable >= minBoardWords) {
      log.debug('Board generated', { findable, seeds: wordsPlaced.length });
      return board;
    }
  }

  // Fallback
  const board = new Array(size * size).fill(null);
  for (let i = 0; i < board.length; i++) {
    board[i] = FILL_LETTERS[Math.floor(Math.random() * FILL_LETTERS.length)];
  }
  log.warn('Board generated with fallback', { findable: countBoardWords(board, size) });
  return board;
}

module.exports = { generate, isValidPath };
