import React from 'react';
import { createRoot } from 'react-dom/client';
import { GameProvider } from '../shared/GameContext';
import SoundLoader from '../shared/SoundLoader';
import '../shared/global.css';
import HostApp from './HostApp';

createRoot(document.getElementById('root')).render(
  <SoundLoader>
    <GameProvider role="host">
      <HostApp />
    </GameProvider>
  </SoundLoader>
);
