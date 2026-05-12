import React from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../shared/GameContext';

export default function EndScreen() {
  const { state, send } = useGame();
  const { score, words, isHost } = state;

  const restart = () => send({ type: 'restart', gridSize: state.gridSize, minWordLen: state.minWordLen, duration: state.duration });

  return (
    <motion.div className="screen center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
      <h2 className="title">⏰ Time's Up!</h2>
      <motion.div className="score-final" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
        {score} pts
      </motion.div>
      <p className="subtitle">{words.length} word{words.length !== 1 ? 's' : ''} found</p>
      <p className="hint">Check the main screen for results!</p>
      {isHost && (
        <motion.button className="btn" onClick={restart} whileTap={{ scale: 0.95 }}>
          Next Round
        </motion.button>
      )}
    </motion.div>
  );
}
