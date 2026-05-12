import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../shared/GameContext';

export default function JoinScreen() {
  const { send, state, connected } = useGame();
  const [name, setName] = useState('');
  const code = new URLSearchParams(window.location.search).get('room') || '';

  useEffect(() => {
    if (connected && code) {
      send({ type: 'joining', code });
    }
  }, [connected, code, send]);

  const handleJoin = () => {
    if (!code) return;
    send({ type: 'join', name: name.trim() || 'Anon', code });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-5">
      <motion.div
        className="glass p-8 flex flex-col items-center w-full max-w-xs"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <h2 className="font-display text-2xl font-bold text-accent mb-6">🎲 Join Game</h2>

        <input
          className="w-full px-4 py-3 rounded-xl text-center text-lg font-semibold
            bg-white/50 border border-white/60 backdrop-blur-md
            text-[#2d1b4e] placeholder-[#2d1b4e]/40
            focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40
            shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
          placeholder="Your name"
          maxLength={12}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          autoFocus
        />

        <motion.button
          className="btn-primary w-full mt-4 py-4 text-lg rounded-xl"
          onClick={handleJoin}
          whileTap={{ scale: 0.95 }}
        >
          Join Game
        </motion.button>

        {state.error && <p className="text-red-500 text-sm mt-3">{state.error}</p>}
        {!code && <p className="text-red-500 text-sm mt-3">No room code in URL. Scan the QR code from the display.</p>}
      </motion.div>
    </div>
  );
}
