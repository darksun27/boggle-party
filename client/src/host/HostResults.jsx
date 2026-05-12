import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../shared/GameContext';

export default function HostResults() {
  const { state } = useGame();
  const { results } = state;
  const [revealIdx, setRevealIdx] = useState(0);

  const entries = Object.entries(results || {}).sort((a, b) => b[1].score - a[1].score);
  const maxScore = entries.length > 0 ? entries[0][1].score : 1;

  // Collect all words for reveal
  const allWords = {};
  entries.forEach(([name, data]) => {
    data.words.forEach(w => { if (!allWords[w]) allWords[w] = []; allWords[w].push(name); });
  });
  const wordList = Object.entries(allWords).sort((a, b) => a[0].length - b[0].length);

  // Auto-reveal words
  useEffect(() => {
    if (revealIdx >= wordList.length) return;
    const t = setTimeout(() => setRevealIdx(i => i + 1), 400);
    return () => clearTimeout(t);
  }, [revealIdx, wordList.length]);

  return (
    <div className="screen center host-results">
      <h2 className="results-title">🏁 Results!</h2>

      <div className="podium">
        {entries.slice(0, 3).map(([name, data], i) => (
          <motion.div
            key={name}
            className={`podium-entry place-${i + 1}`}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.3, type: 'spring' }}
          >
            <img className="podium-avatar" src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${name}&backgroundColor=b6e3f4,c0aede,d1d4f9`} alt={name} />
            <div className="podium-name">{name}</div>
            <div className="podium-score">{data.score} pts</div>
            <motion.div
              className="podium-bar"
              initial={{ height: 0 }}
              animate={{ height: `${(data.score / maxScore) * 150}px` }}
              transition={{ delay: i * 0.3 + 0.5, type: 'spring' }}
            />
          </motion.div>
        ))}
      </div>

      <div className="word-reveal">
        <AnimatePresence>
          {wordList.slice(0, revealIdx).map(([word, players], i) => (
            <motion.span
              key={word}
              className={`reveal-chip ${players.length > 1 ? 'common' : 'unique'}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500 }}
            >
              {word}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
