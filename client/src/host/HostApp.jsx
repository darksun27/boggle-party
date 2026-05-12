import React, { useEffect } from 'react';
import { useGame } from '../shared/GameContext';
import HostLobby from './HostLobby';
import HostGame from './HostGame';
import HostResults from './HostResults';
import './host.css';

export default function HostApp() {
  const { state, send, connected } = useGame();

  useEffect(() => {
    if (connected && state.screen === 'loading') {
      send({ type: 'create-room' });
    }
  }, [connected, state.screen, send]);

  switch (state.screen) {
    case 'loading': return <div className="screen center"><h1 className="logo">🎲 BOGGLE PARTY</h1><p>Connecting...</p></div>;
    case 'lobby': return <HostLobby />;
    case 'playing': return <HostGame />;
    case 'ended': return <HostResults />;
    default: return null;
  }
}
