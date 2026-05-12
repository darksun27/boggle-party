import React from 'react';
import { createRoot } from 'react-dom/client';
import { GameProvider } from '../shared/GameContext';
import '../shared/global.css';
import HostApp from './HostApp';

createRoot(document.getElementById('root')).render(
  <GameProvider role="host">
    <HostApp />
  </GameProvider>
);
