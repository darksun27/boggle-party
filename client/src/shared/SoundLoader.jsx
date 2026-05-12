import React, { useState, useEffect } from 'react';
import { preloadSounds } from 'react-sounds';
import { ALL_SOUNDS } from './useSounds';

export default function SoundLoader({ children }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    preloadSounds(ALL_SOUNDS).then(() => setLoaded(true)).catch(() => setLoaded(true));
  }, []);

  if (!loaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="font-display text-3xl font-bold bg-gradient-to-r from-accent to-pink bg-clip-text text-transparent">
          🎲 BOGGLE PARTY
        </h1>
        <div className="w-48 h-2 rounded-full bg-white/20 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-accent to-pink rounded-full animate-pulse w-2/3" />
        </div>
        <p className="text-sm opacity-60">Loading sounds...</p>
      </div>
    );
  }

  return children;
}
