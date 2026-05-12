import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../shared/GameContext';

export default function HostResults() {
  const { state } = useGame();
  const { results } = state;
  const [revealIdx, setRevealIdx] = useState(0);

  const entries = Object.entries(results || {}).sort((a, b) => b[1].score - a[1].score);
  const maxScore = entries.length > 0 ? entries[0][1].score : 1;

  const allWords = {};
  entries.forEach(([name, data]) => {
    data.words.forEach(w => { if (!allWords[w]) allWords[w] = []; allWords[w].push(name); });
  });
  const wordList = Object.entries(allWords).sort((a, b) => a[0].length - b[0].length);

  useEffect(() => {
    if (revealIdx >= wordList.length) return;
    const t = setTimeout(() => setRevealIdx(i => i + 1), 350);
    return () => clearTimeout(t);
  }, [revealIdx, wordList.length]);

  return (
    <div className="flex flex-col items-center min-h-screen p-5">
      <h2 className="font-display text-4xl font-bold bg-gradient-to-r from-pink via-yellow-300 to-cyan-300 bg-clip-text text-transparent mb-6">
        🏁 Results!
      </h2>

      {/* Podium */}
      <div className="flex items-end gap-4 mb-8">
        {entries.slice(0, 3).map(([name, data], i) => (
          <motion.div
            key={name}
            className="flex flex-col items-center"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.3, type: 'spring' }}
          >
            <img
              className="w-16 h-16 rounded-full border-3 border-white/60 shadow-lg mb-2"
              src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${name}&backgroundColor=b6e3f4,c0aede,d1d4f9`}
              alt={name}
            />
            <div className="font-semibold text-sm">{name}</div>
            <div className="font-display font-bold text-accent">{data.score} pts</div>
            <motion.div
              className="w-20 rounded-t-xl mt-2 border border-white/40"
              style={{ background: i === 0 ? 'linear-gradient(180deg, rgba(255,215,0,0.4), rgba(255,78,203,0.3))' : 'linear-gradient(180deg, rgba(255,78,203,0.3), rgba(107,33,168,0.3))' }}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(20, (data.score / maxScore) * 140)}px` }}
              transition={{ delay: i * 0.3 + 0.5, type: 'spring' }}
            />
          </motion.div>
        ))}
      </div>

      {/* Word reveal */}
      <div className="flex flex-wrap gap-2 justify-center max-w-3xl max-h-60 overflow-y-auto">
        <AnimatePresence>
          {wordList.slice(0, revealIdx).map(([word, players]) => (
            <motion.span
              key={word}
              className={`glass px-3 py-1 text-sm ${players.length > 1 ? 'border-purple-400/40' : 'border-yellow-400/40'}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500 }}
            >
              {word}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      <p className="mt-6 opacity-60 animate-pulse">⚡ Waiting for host to start next round...</p>
    </div>
  );
}
