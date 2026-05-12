import React from 'react';
import { useGame } from '../shared/GameContext';
import HostLobby from './HostLobby';
import HostGame from './HostGame';
import HostResults from './HostResults';
import './host.css';

export default function HostApp() {
  const { state } = useGame();

  switch (state.screen) {
    case 'loading': return <div className="flex flex-col items-center justify-center min-h-screen"><h1 className="font-display text-4xl font-bold bg-gradient-to-r from-accent to-pink bg-clip-text text-transparent">🎲 BOGGLE PARTY</h1><p className="mt-4 animate-pulse">Connecting...</p></div>;
    case 'lobby': return <HostLobby />;
    case 'playing': return <HostGame />;
    case 'ended': return <HostResults />;
    default: return null;
  }
}
