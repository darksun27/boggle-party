import React from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../shared/GameContext';
import Avatar from '../shared/Avatar';

export default function HostGame() {
  const { state } = useGame();
  const { board, gridSize, timeLeft, duration, players } = state;
  const timerPct = duration > 0 ? timeLeft / duration : 1;
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const urgent = timeLeft <= 10;

  return (
    <div className="flex flex-col items-center min-h-screen p-4">
      {/* Timer */}
      <div className="w-full max-w-2xl mb-2">
        <div className="glass h-4 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: urgent ? 'linear-gradient(90deg, #ef4444, #f97316)' : 'linear-gradient(90deg, #84fab0, #4de8ff)' }}
            animate={{ width: `${timerPct * 100}%` }}
            transition={{ duration: 1, ease: 'linear' }}
          />
        </div>
      </div>
      <div className={`font-display text-3xl font-bold mb-4 ${urgent ? 'text-red-500 animate-pulse' : 'text-accent'}`}>
        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
      </div>

      {/* Board */}
      <div className="grid gap-2 mb-6" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
        {board && board.map((letter, i) => (
          <motion.div
            key={i}
            className="glass w-[70px] h-[70px] flex items-center justify-center text-2xl font-bold"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.02, type: 'spring', stiffness: 400 }}
          >
            {letter === 'Q' ? 'Qu' : letter}
          </motion.div>
        ))}
      </div>

      {/* Scoreboard */}
      <div className="w-full max-w-md space-y-2">
        {sorted.map((p, i) => (
          <motion.div
            key={p.name}
            className="glass flex items-center gap-3 px-4 py-2"
            layout
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <span className="font-display text-sm opacity-50 w-6">#{i + 1}</span>
            <Avatar name={p.name} size={32} />
            <span className="flex-1 font-semibold">{p.name}</span>
            <span className="font-display font-bold text-accent">{p.score}</span>
            <span className="text-xs opacity-50">{p.wordCount}w</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
