import { useRef } from 'react';

let audioCtx = null;
function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function tone(freq, duration, type = 'sine', vol = 0.25) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function noise(duration, vol = 0.06) {
  const ctx = getCtx();
  const buf = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 4000;
  src.buffer = buf;
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start();
  src.stop(ctx.currentTime + duration);
}

const sfx = {
  cellTap: () => noise(0.03),
  wordAccepted: () => { tone(523, 0.1); setTimeout(() => tone(659, 0.1), 70); setTimeout(() => tone(784, 0.12), 140); },
  wordRejected: () => tone(180, 0.1, 'sawtooth', 0.15),
  alreadyFound: () => { tone(400, 0.1); setTimeout(() => tone(350, 0.08), 70); },
  gameStart: () => { tone(660, 0.15); setTimeout(() => tone(880, 0.15), 150); },
  gameOver: () => { tone(523, 0.12); setTimeout(() => tone(659, 0.12), 100); setTimeout(() => tone(784, 0.15), 200); },
  playerJoin: () => { tone(880, 0.1); setTimeout(() => tone(1100, 0.08), 60); },
  timerTick: () => noise(0.02, 0.04),
  timerWarning: () => tone(600, 0.08, 'sine', 0.15),
  click: () => noise(0.015, 0.04),
};

export function useSounds() {
  return sfx;
}
