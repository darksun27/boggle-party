import React from 'react';
import BoringAvatar from 'boring-avatars';

const PALETTE = ['#ff4ecb', '#6b21a8', '#4de8ff', '#84fab0', '#ffde59', '#f97316', '#a78bfa'];

export default function Avatar({ name, size = 64, className = '' }) {
  return (
    <div className={className} style={{ width: size, height: size }}>
      <BoringAvatar size={size} name={name} variant="beam" colors={PALETTE} />
    </div>
  );
}
