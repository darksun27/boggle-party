import { useCallback, useRef } from 'react';

export function useSounds() {
  const ctxRef = useRef(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    return ctxRef.current;
  }, []);

  const tone = useCallback((freq, duration, type = 'sine', vol = 0.3) => {
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
  }, [getCtx]);

  const noise = useCallback((duration, vol = 0.08) => {
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
  }, [getCtx]);

  return {
    cellTap: useCallback(() => noise(0.04), [noise]),
    wordAccepted: useCallback(() => {
      tone(523, 0.12); setTimeout(() => tone(659, 0.12), 80); setTimeout(() => tone(784, 0.15), 160);
    }, [tone]),
    wordRejected: useCallback(() => tone(180, 0.12, 'sawtooth'), [tone]),
    alreadyFound: useCallback(() => { tone(400, 0.12); setTimeout(() => tone(350, 0.1), 80); }, [tone]),
    gameStart: useCallback(() => {
      tone(440, 0.2); setTimeout(() => tone(440, 0.2), 400);
      setTimeout(() => tone(440, 0.2), 800); setTimeout(() => { tone(660, 0.3); tone(880, 0.25); }, 1200);
    }, [tone]),
    gameOver: useCallback(() => {
      tone(523, 0.15); setTimeout(() => tone(659, 0.15), 120); setTimeout(() => tone(784, 0.2), 240);
    }, [tone]),
    playerJoin: useCallback(() => { tone(880, 0.15); setTimeout(() => tone(1100, 0.12), 80); }, [tone]),
    timerTick: useCallback(() => noise(0.03, 0.05), [noise]),
    timerWarning: useCallback(() => tone(600, 0.1), [tone]),
    click: useCallback(() => noise(0.02, 0.06), [noise]),
  };
}
