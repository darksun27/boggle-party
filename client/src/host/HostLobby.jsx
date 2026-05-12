import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../shared/GameContext';

const floatVariants = {
  animate: (i) => ({
    y: [0, -12, -6, -15, 0],
    transition: { duration: 3 + (i % 3), repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 },
  }),
};

const enterVariants = {
  initial: { scale: 0, rotate: -10, opacity: 0 },
  animate: { scale: 1, rotate: 0, opacity: 1, transition: { type: 'spring', stiffness: 400, damping: 15 } },
  exit: { scale: 0, rotate: 10, opacity: 0, transition: { duration: 0.2 } },
};

function PlayerCard({ player, index }) {
  return (
    <motion.div
      layout
      custom={index}
      variants={enterVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <motion.div
        className="glass flex flex-col items-center p-3 w-24"
        custom={index}
        variants={floatVariants}
        animate="animate"
      >
        <img
          className="w-16 h-16 rounded-full border-2 border-white/60 shadow-lg"
          src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${player.name}&backgroundColor=b6e3f4,c0aede,d1d4f9`}
          alt={player.name}
        />
        <span className="text-xs font-bold mt-1 truncate w-full text-center">{player.name}</span>
        {player.isHost && (
          <span className="text-[10px] bg-gradient-to-r from-pink to-purple-400 text-white px-2 py-0.5 rounded mt-1 font-bold">HOST</span>
        )}
      </motion.div>
    </motion.div>
  );
}

function TypingCard({ index }) {
  return (
    <motion.div
      className="glass flex flex-col items-center p-3 w-24 opacity-60"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center text-2xl animate-pulse">✏️</div>
      <span className="text-xs mt-1 opacity-70">joining...</span>
    </motion.div>
  );
}

export default function HostLobby() {
  const { state } = useGame();
  const joinUrl = `${window.location.origin}/play?room=${state.roomCode}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(joinUrl)}`;

  const leftPlayers = state.players.filter((_, i) => i % 2 === 0);
  const rightPlayers = state.players.filter((_, i) => i % 2 === 1);
  const leftTyping = Math.ceil(state.typingCount / 2);
  const rightTyping = Math.floor(state.typingCount / 2);

  return (
    <div className="relative flex items-center justify-center min-h-screen p-5">
      {/* Left side players */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-10">
        <AnimatePresence>
          {leftPlayers.map((p, i) => <PlayerCard key={p.name} player={p} index={i} />)}
          {Array.from({ length: leftTyping }).map((_, i) => <TypingCard key={`lt-${i}`} index={i} />)}
        </AnimatePresence>
      </div>

      {/* Right side players */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-10">
        <AnimatePresence>
          {rightPlayers.map((p, i) => <PlayerCard key={p.name} player={p} index={i} />)}
          {Array.from({ length: rightTyping }).map((_, i) => <TypingCard key={`rt-${i}`} index={i} />)}
        </AnimatePresence>
      </div>

      {/* Center content */}
      <div className="flex flex-col items-center">
        <h1 className="font-display text-4xl font-bold bg-gradient-to-r from-accent to-pink bg-clip-text text-transparent mb-5">
          🎲 BOGGLE PARTY
        </h1>

        <div className="glass p-8 text-center mb-5">
          <div className="font-display text-5xl font-bold text-accent tracking-[8px] mb-4">
            {state.roomCode}
          </div>
          <img
            className="w-48 h-48 mx-auto rounded-2xl p-3 bg-white/90 shadow-lg border border-white/30"
            src={qrUrl}
            alt="QR Code"
          />
          <div className="mt-3 text-sm opacity-60 font-mono break-all">{joinUrl}</div>
        </div>

        <div className="flex gap-4 mb-5">
          <div className="glass px-5 py-3 text-center">
            <div className="text-xs opacity-60">Grid</div>
            <div className="font-display font-bold text-lg">{state.gridSize}×{state.gridSize}</div>
          </div>
          <div className="glass px-5 py-3 text-center">
            <div className="text-xs opacity-60">Min</div>
            <div className="font-display font-bold text-lg">{state.minWordLen}+</div>
          </div>
          <div className="glass px-5 py-3 text-center">
            <div className="text-xs opacity-60">Time</div>
            <div className="font-display font-bold text-lg">{state.duration}s</div>
          </div>
        </div>

        <p className="text-lg opacity-70 animate-pulse">
          {state.players.length > 0 ? '⚡ Waiting for host to start...' : '⚡ Waiting for players to join...'}
        </p>
      </div>
    </div>
  );
}
