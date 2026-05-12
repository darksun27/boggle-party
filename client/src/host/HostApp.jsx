import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../shared/GameContext';
import HostLobby from './HostLobby';
import HostGame from './HostGame';
import HostResults from './HostResults';
import './host.css';

function EnterScreen({ onEnter }) {
  const handleEnter = () => {
    document.documentElement.requestFullscreen?.() || document.documentElement.webkitRequestFullscreen?.();
    onEnter();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <h1 className="font-display text-5xl font-bold bg-gradient-to-r from-accent to-pink bg-clip-text text-transparent">
        🎲 BOGGLE PARTY
      </h1>
      <motion.button
        className="btn-primary px-10 py-5 text-xl rounded-2xl"
        onClick={handleEnter}
        whileTap={{ scale: 0.95 }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        Enter Game
      </motion.button>
    </div>
  );
}

export default function HostApp() {
  const { state } = useGame();
  const [entered, setEntered] = useState(false);

  if (!entered) return <EnterScreen onEnter={() => setEntered(true)} />;

  switch (state.screen) {
    case 'loading': return <div className="flex flex-col items-center justify-center min-h-screen"><h1 className="font-display text-4xl font-bold bg-gradient-to-r from-accent to-pink bg-clip-text text-transparent">🎲 BOGGLE PARTY</h1><p className="mt-4 animate-pulse">Connecting...</p></div>;
    case 'lobby': return <HostLobby />;
    case 'playing': return <HostGame />;
    case 'ended': return <HostResults />;
    default: return null;
  }
}
