import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../shared/GameContext';
import Avatar from '../shared/Avatar';
import { useSounds } from '../shared/useSounds';

export default function HostGame() {
  const { state } = useGame();
  const sfx = useSounds();
  const { board, gridSize, timeLeft, duration, players } = state;
  const timerPct = duration > 0 ? timeLeft / duration : 1;
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const urgent = timeLeft <= 10;

  useEffect(() => {
    if (timeLeft <= 5 && timeLeft > 0) sfx.timerWarning();
  }, [timeLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col items-center h-screen overflow-hidden">
      {/* Timer bar - top */}
      <div className="w-full h-3">
        <motion.div
          className="h-full"
          style={{ background: urgent ? 'linear-gradient(90deg, #ef4444, #f97316)' : 'linear-gradient(90deg, #84fab0, #4de8ff)' }}
          animate={{ width: `${timerPct * 100}%` }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </div>

      {/* Timer text */}
      <div className={`font-display text-4xl font-bold mt-3 ${urgent ? 'text-red-500 animate-pulse' : 'text-accent'}`}>
        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
      </div>

      {/* Board - centered, huge */}
      <div className="flex-1 flex items-center justify-center">
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
          {board && board.map((letter, i) => (
            <motion.div
              key={i}
              className="glass w-[100px] h-[100px] flex items-center justify-center text-4xl font-bold"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.02, type: 'spring', stiffness: 400 }}
            >
              {letter === 'Q' ? 'Qu' : letter}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Scoreboard - bottom */}
      <div className="w-full flex justify-center gap-6 pb-4">
        {sorted.map((p, i) => (
          <motion.div
            key={p.name}
            className="glass flex items-center gap-2 px-4 py-2"
            layout
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <span className="font-display text-sm opacity-50">#{i + 1}</span>
            <Avatar name={p.name} size={36} />
            <span className="font-semibold">{p.name}</span>
            <span className="font-display font-bold text-accent text-lg">{p.score}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
