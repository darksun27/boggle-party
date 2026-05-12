import React from 'react';

const EMOJIS = ['🦊', '🐸', '🦆', '🐙', '🦄', '🐢', '🦩', '🐧', '🦋', '🐝', '🦁', '🐼'];
const COLORS = ['#fecaca', '#bfdbfe', '#c4b5fd', '#d1fae5', '#fde68a', '#fbcfe8', '#a5f3fc', '#e9d5ff'];

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export default function Avatar({ name, size = 64, className = '' }) {
  const h = hashCode(name);
  const emoji = EMOJIS[h % EMOJIS.length];
  const bg = COLORS[h % COLORS.length];

  return (
    <div
      className={`flex items-center justify-center rounded-full border-2 border-white/60 shadow-md ${className}`}
      style={{ width: size, height: size, backgroundColor: bg, fontSize: size * 0.5 }}
    >
      {emoji}
    </div>
  );
}
