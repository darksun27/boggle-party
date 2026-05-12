import React from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../shared/GameContext';

export default function EndScreen() {
  const { state, send } = useGame();
  const { score, words, isHost } = state;

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
        <p className="text-xs opacity-50 mb-4">Check the main screen for results!</p>
        {isHost && (
          <motion.button className="btn-primary w-full py-3 rounded-xl" onClick={restart} whileTap={{ scale: 0.95 }}>
            Next Round
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
