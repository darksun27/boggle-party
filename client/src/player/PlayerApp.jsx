import React from 'react';
import { useGame } from '../shared/GameContext';
import JoinScreen from './JoinScreen';
import Lobby from './Lobby';
import GameBoard from './GameBoard';
import EndScreen from './EndScreen';

export default function PlayerApp() {
  const { state } = useGame();

  switch (state.screen) {
    case 'loading': return <JoinScreen />;
    case 'lobby': return <Lobby />;
    case 'playing': return <GameBoard />;
    case 'ended': return <EndScreen />;
    default: return <JoinScreen />;
  }
}
