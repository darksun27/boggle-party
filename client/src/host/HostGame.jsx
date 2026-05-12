import React from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../shared/GameContext';

export default function HostGame() {
  const { state } = useGame();
  const { board, gridSize, timeLeft, duration, players } = state;
  const timerPct = duration > 0 ? timeLeft / duration : 1;
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="screen host-game">
      <div className="timer-bar-host">
        <motion.div className="timer-fill-host" animate={{ width: `${timerPct * 100}%` }} transition={{ duration: 1, ease: 'linear' }} />
      </div>
      <div className="timer-text">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</div>

      <div className="host-board" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
        {board && board.map((letter, i) => (
          <motion.div key={i} className="host-cell" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.02 }}>
            {letter === 'Q' ? 'Qu' : letter}
          </motion.div>
        ))}
      </div>

      <div className="scoreboard">
        {sorted.map((p, i) => (
          <motion.div key={p.name} className="score-row" layout transition={{ type: 'spring', stiffness: 300 }}>
            <span className="rank">#{i + 1}</span>
            <img className="score-avatar" src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${p.name}&backgroundColor=b6e3f4,c0aede,d1d4f9`} alt={p.name} />
            <span className="score-name">{p.name}</span>
            <span className="score-pts">{p.score}</span>
            <span className="score-words">{p.wordCount}w</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
