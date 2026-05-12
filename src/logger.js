'use strict';

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const level = LEVELS[process.env.LOG_LEVEL || 'info'] !== undefined ? LEVELS[process.env.LOG_LEVEL || 'info'] : 2;

function log(lvl, msg, data) {
  if (LEVELS[lvl] > level) return;
  const entry = { time: new Date().toISOString(), level: lvl, msg };
  if (data) entry.data = data;
  process.stdout.write(JSON.stringify(entry) + '\n');
}

module.exports = {
  error: (msg, data) => log('error', msg, data),
  warn: (msg, data) => log('warn', msg, data),
  info: (msg, data) => log('info', msg, data),
  debug: (msg, data) => log('debug', msg, data),
};
