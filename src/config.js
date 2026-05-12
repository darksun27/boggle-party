'use strict';

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  game: {
    defaultDuration: parseInt(process.env.GAME_DURATION, 10) || 180,
    defaultGridSize: parseInt(process.env.GRID_SIZE, 10) || 4,
    defaultMinWordLen: parseInt(process.env.MIN_WORD_LEN, 10) || 3,
    minBoardWords: parseInt(process.env.MIN_BOARD_WORDS, 10) || 20,
    maxWordLen: 8,
    maxSeedAttempts: 300,
    maxRegenAttempts: 20,
    maxSeedWords: 12,
  },
  dictionary: {
    validationUrl: process.env.DICT_URL || 'https://raw.githubusercontent.com/redbo/scrabble/master/dictionary.txt',
    seedUrl: process.env.SEED_URL || 'https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-no-swears.txt',
    maxSeedWordLen: 7,
  },
};
