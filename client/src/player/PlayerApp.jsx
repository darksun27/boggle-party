import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../shared/GameContext';
import JoinScreen from './JoinScreen';
import Lobby from './Lobby';
import GameBoard from './GameBoard';
import EndScreen from './EndScreen';

export default function PlayerApp() {
  const { state } = useGame();
  const [showHostBanner, setShowHostBanner] = useState(false);
  const prevIsHost = useRef(state.isHost);

  useEffect(() => {
    if (state.isHost && !prevIsHost.current) {
      setShowHostBanner(true);
      const t = setTimeout(() => setShowHostBanner(false), 10000);
      return () => clearTimeout(t);
    }
    prevIsHost.current = state.isHost;
  }, [state.isHost]);

  let screen;
  switch (state.screen) {
    case 'loading': screen = <JoinScreen />; break;
    case 'lobby': screen = <Lobby />; break;
    case 'playing': screen = <GameBoard />; break;
    case 'ended': screen = <EndScreen />; break;
    default: screen = <JoinScreen />;
  }

  return (
    <>
      {screen}
      <AnimatePresence>
        {showHostBanner && (
          <motion.div
            className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-white/40 shadow-lg py-4 text-center"
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <span className="font-display text-lg text-accent font-bold">👑 You are now the Host!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
