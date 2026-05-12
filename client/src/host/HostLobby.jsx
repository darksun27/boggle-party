import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../shared/GameContext';

export default function HostLobby() {
  const { state } = useGame();
  const joinUrl = `${window.location.origin}/play?room=${state.roomCode}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(joinUrl)}`;

  return (
    <div className="screen center">
      <h1 className="logo">🎲 BOGGLE PARTY</h1>

      <div className="glass-panel qr-section">
        <div className="room-code">{state.roomCode}</div>
        <img className="qr-img" src={qrUrl} alt="QR Code" />
        <div className="join-url">{joinUrl}</div>
      </div>

      <div className="settings-row">
        <span className="setting-badge">{state.gridSize}×{state.gridSize}</span>
        <span className="setting-badge">{state.minWordLen}+ letters</span>
        <span className="setting-badge">{state.duration}s</span>
      </div>

      <AnimatePresence>
        {state.players.map((p, i) => (
          <motion.div
            key={p.name}
            className="player-card"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: i * 0.1 }}
          >
            <img className="player-avatar" src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${p.name}&backgroundColor=b6e3f4,c0aede,d1d4f9`} alt={p.name} />
            <span className="player-name">{p.name}</span>
            {p.isHost && <span className="host-badge">HOST</span>}
          </motion.div>
        ))}
      </AnimatePresence>

      {state.typingCount > 0 && <p className="typing-indicator">{state.typingCount} joining...</p>}
      <p className="waiting-msg">{state.players.length > 0 ? '⚡ Waiting for host to start...' : '⚡ Waiting for players...'}</p>
    </div>
  );
}
