import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../shared/GameContext';

export default function EndScreen() {
  const { state, send } = useGame();
  const { score, words, isHost, results } = state;
  const [resultsComplete, setResultsComplete] = useState(false);

  // Estimate how long the host results reveal takes
  useEffect(() => {
    if (!results) return;
    const allWords = {};
    Object.values(results).forEach(data => {
      (data.words || []).forEach(w => {
        const word = typeof w === 'string' ? w : w.word;
        allWords[word] = true;
      });
    });
    const totalWords = Object.keys(allWords).length;
    // 1.3s per word + 1s initial delay + 2s buffer for winner animation
    const revealDuration = (totalWords * 1.3 + 3) * 1000;
    const timer = setTimeout(() => setResultsComplete(true), revealDuration);
    return () => clearTimeout(timer);
  }, [results]);

  const restart = () => send({ type: 'restart', gridSize: state.gridSize, minWordLen: state.minWordLen, duration: state.duration });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-5">
      <motion.div
        className="glass p-8 flex flex-col items-center w-full max-w-xs"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <h2 className="font-display text-2xl font-bold text-accent mb-4">⏰ Time's Up!</h2>
        <motion.div
          className="font-display text-4xl font-bold text-accent mb-2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
        >
          {score} pts
        </motion.div>
        <p className="text-sm opacity-70 mb-4">{words.length} word{words.length !== 1 ? 's' : ''} found</p>

        {!resultsComplete && (
          <p className="text-sm opacity-60 animate-pulse text-center">🎬 Results are playing on the main screen...</p>
        )}

        {resultsComplete && isHost && (
          <motion.button
            className="btn-primary w-full py-3 rounded-xl"
            onClick={restart}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Next Round
          </motion.button>
        )}

        {resultsComplete && !isHost && (
          <p className="text-sm opacity-60">⚡ Waiting for host to start next round...</p>
        )}
      </motion.div>
    </div>
  );
}
