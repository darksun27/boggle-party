'use strict';

const https = require('https');
const config = require('./config');
const log = require('./logger');

let validationDict = null;
let seedWords = [];

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} fetching ${url}`));
        res.resume();
        return;
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseWordList(text, minLen = 3, maxLen = Infinity) {
  return text.split('\n')
    .map(w => w.trim().toLowerCase())
    .filter(w => w.length >= minLen && w.length <= maxLen && /^[a-z]+$/.test(w));
}

async function load() {
  const [dictText, commonText] = await Promise.all([
    fetchText(config.dictionary.validationUrl),
    fetchText(config.dictionary.seedUrl),
  ]);

  validationDict = new Set(parseWordList(dictText));
  seedWords = parseWordList(commonText, 3, config.dictionary.maxSeedWordLen)
    .filter(w => validationDict.has(w));

  log.info('Dictionary loaded', {
    validationWords: validationDict.size,
    seedWords: seedWords.length,
  });
}

function isValid(word) {
  if (!validationDict) return true; // graceful fallback if dict not loaded
  return validationDict.has(word.toLowerCase());
}

function isLoaded() {
  return validationDict !== null;
}

function getRandomSeedWord(maxLen) {
  if (!seedWords.length) return null;
  for (let i = 0; i < 20; i++) {
    const w = seedWords[Math.floor(Math.random() * seedWords.length)];
    if (w.length <= maxLen && !w.includes('q')) return w;
  }
  return null;
}

function getValidationDict() {
  return validationDict;
}

module.exports = { load, isValid, isLoaded, getRandomSeedWord, getValidationDict };
