import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../shared/GameContext';

export default function JoinScreen() {
  const { send, state } = useGame();
  const [name, setName] = useState('');
  const code = new URLSearchParams(window.location.search).get('room') || '';

  const handleJoin = () => {
    if (!code) return;
    send({ type: 'join', name: name.trim() || 'Anon', code });
  };

  return (
    <motion.div className="screen center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="title">🎲 Join Game</h2>
      <input
        className="input"
        placeholder="Your name"
        maxLength={12}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
        autoFocus
      />
      <motion.button className="btn" onClick={handleJoin} whileTap={{ scale: 0.95 }}>
        Join
      </motion.button>
      {state.error && <p className="error-msg">{state.error}</p>}
      {!code && <p className="error-msg">No room code in URL. Scan the QR code from the display.</p>}
    </motion.div>
  );
}
