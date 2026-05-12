import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../shared/GameContext';

const SIZES = [4, 5, 6];
const DURATIONS = [60, 90, 120, 180];

export default function Lobby() {
  const { state, send } = useGame();
  const [gridIdx, setGridIdx] = useState(0);
  const [durIdx, setDurIdx] = useState(3);

  const startGame = () => {
    send({ type: 'start-game', gridSize: SIZES[gridIdx], minWordLen: state.minWordLen, duration: DURATIONS[durIdx] });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-5">
      <motion.div
        className="glass p-6 flex flex-col items-center w-full max-w-sm"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <h2 className="font-display text-xl font-bold text-accent mb-2">🎲 Lobby</h2>
        <p className="text-sm opacity-70 mb-4">{state.players.length} player{state.players.length !== 1 ? 's' : ''} joined</p>

        {state.isHost ? (
          <>
            <div className="w-full bg-white/20 rounded-xl p-4 border border-white/40 mb-4">
              <h3 className="font-display text-sm font-bold text-accent text-center mb-4">👑 You're the Host</h3>

              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold">Grid</span>
                <div className="flex items-center gap-3">
                  <button className="w-9 h-9 rounded-full glass flex items-center justify-center text-xl text-accent" onClick={() => setGridIdx((gridIdx - 1 + SIZES.length) % SIZES.length)}>‹</button>
                  <span className="font-display font-bold w-12 text-center">{SIZES[gridIdx]}×{SIZES[gridIdx]}</span>
                  <button className="w-9 h-9 rounded-full glass flex items-center justify-center text-xl text-accent" onClick={() => setGridIdx((gridIdx + 1) % SIZES.length)}>›</button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Time</span>
                <div className="flex items-center gap-3">
                  <button className="w-9 h-9 rounded-full glass flex items-center justify-center text-xl text-accent" onClick={() => setDurIdx((durIdx - 1 + DURATIONS.length) % DURATIONS.length)}>‹</button>
                  <span className="font-display font-bold w-12 text-center">{DURATIONS[durIdx]}s</span>
                  <button className="w-9 h-9 rounded-full glass flex items-center justify-center text-xl text-accent" onClick={() => setDurIdx((durIdx + 1) % DURATIONS.length)}>›</button>
                </div>
              </div>
            </div>

            <motion.button
              className="btn-primary w-full py-4 text-lg rounded-xl"
              onClick={startGame}
              whileTap={{ scale: 0.95 }}
            >
              Start Game
            </motion.button>
          </>
        ) : (
          <p className="text-base opacity-70 animate-pulse">⚡ Waiting for host to start...</p>
        )}
      </motion.div>
    </div>
  );
}
