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
    <motion.div className="screen center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="title">🎲 Lobby</h2>
      <p className="subtitle">{state.players.length} player{state.players.length !== 1 ? 's' : ''} joined</p>

      {state.isHost ? (
        <div className="glass-card">
          <h3 className="card-title">👑 You're the Host</h3>
          <div className="setting-row">
            <span>Grid</span>
            <div className="picker">
              <button onClick={() => setGridIdx((gridIdx - 1 + SIZES.length) % SIZES.length)}>‹</button>
              <span className="picker-val">{SIZES[gridIdx]}×{SIZES[gridIdx]}</span>
              <button onClick={() => setGridIdx((gridIdx + 1) % SIZES.length)}>›</button>
            </div>
          </div>
          <div className="setting-row">
            <span>Time</span>
            <div className="picker">
              <button onClick={() => setDurIdx((durIdx - 1 + DURATIONS.length) % DURATIONS.length)}>‹</button>
              <span className="picker-val">{DURATIONS[durIdx]}s</span>
              <button onClick={() => setDurIdx((durIdx + 1) % DURATIONS.length)}>›</button>
            </div>
          </div>
          <motion.button className="btn btn-full" onClick={startGame} whileTap={{ scale: 0.95 }}>
            Start Game
          </motion.button>
        </div>
      ) : (
        <p className="waiting">⚡ Waiting for host to start...</p>
      )}
    </motion.div>
  );
}
