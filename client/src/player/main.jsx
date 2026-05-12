import React from 'react';
import { createRoot } from 'react-dom/client';
import { GameProvider } from '../shared/GameContext';
import SoundLoader from '../shared/SoundLoader';
import '../shared/global.css';
import PlayerApp from './PlayerApp';

createRoot(document.getElementById('root')).render(
  <SoundLoader>
    <GameProvider role="player">
      <PlayerApp />
    </GameProvider>
  </SoundLoader>
);
