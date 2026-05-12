import React from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../shared/GameContext';

export default function EndScreen() {
  const { state, send } = useGame();
  const { isHost, resultsComplete } = state;

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
